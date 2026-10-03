const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { DatabaseSync } = require('node:sqlite');

require.extensions['.ts'] = (module, file) =>
  module._compile(
    ts.transpileModule(
      fs.readFileSync(file, 'utf8'),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
          esModuleInterop: true,
        },
      },
    ).outputText,
    file,
  );

const {
  communityAuthFetch,
  verifyCommunitySession,
} = require('../private-demo-service/src/auth.ts');

function setup() {
  const db = new DatabaseSync(':memory:');
  const migrationsDir = path.join(
    __dirname,
    '../private-demo-service/migrations',
  );

  for (
    const file of fs
      .readdirSync(migrationsDir)
      .filter(name => name.endsWith('.sql'))
      .sort()
  ) {
    db.exec(
      fs.readFileSync(
        path.join(migrationsDir, file),
        'utf8',
      ),
    );
  }

  function prepare(query) {
    let args = [];

    return {
      bind(...values) {
        args = values;
        return this;
      },
      async first() {
        return db.prepare(query).get(...args) || null;
      },
      async all() {
        return {
          results: db.prepare(query).all(...args),
        };
      },
      async run() {
        return {
          meta: {
            changes: Number(
              db.prepare(query).run(...args).changes,
            ),
          },
        };
      },
    };
  }

  const env = {
    DB: {
      prepare,
      async batch(statements) {
        db.exec('BEGIN');

        try {
          const results = [];

          for (const statement of statements) {
            results.push(await statement.run());
          }

          db.exec('COMMIT');
          return results;
        } catch (error) {
          db.exec('ROLLBACK');
          throw error;
        }
      },
    },
  };

  async function auth(pathname, body, token) {
    const response = await communityAuthFetch(
      new Request(
        `https://test/api/community/auth${pathname}`,
        {
          method: body ? 'POST' : 'GET',
          headers: token
            ? {
                authorization: `Bearer ${token}`,
                'content-type': 'application/json',
              }
            : {
                'content-type': 'application/json',
              },
          body: body
            ? JSON.stringify(body)
            : undefined,
        },
      ),
      env,
    );

    return {
      status: response.status,
      body: await response.json(),
    };
  }

  return { db, env, auth };
}

test(
  'Community signup hashes passwords and starts eligibility closed',
  async () => {
    const { db, auth } = setup();

    const result = await auth('/signup', {
      email: ' Supporter@Example.com ',
      password: 'correct horse battery staple',
    });

    assert.equal(result.status, 201);
    assert.equal(
      result.body.email,
      'supporter@example.com',
    );
    assert.equal(
      result.body.communityEligible,
      false,
    );
    assert.equal(
      result.body.eligibilityPending,
      true,
    );
    assert.ok(result.body.token);

    const account = db
      .prepare(
        `SELECT *
         FROM community_accounts
         WHERE email_normalized=?`,
      )
      .get('supporter@example.com');

    assert.ok(account);
    assert.notEqual(
      account.password_hash,
      'correct horse battery staple',
    );
    assert.match(
      account.password_hash,
      /^scrypt\$/,
    );
    assert.equal(account.community_eligible, 0);
    assert.equal(account.is_child, null);

    const all = JSON.stringify(
      db.prepare(
        'SELECT * FROM community_accounts',
      ).all(),
    );

    assert.equal(
      all.includes(
        'correct horse battery staple',
      ),
      false,
    );
  },
);

test(
  'Community login issues revocable server sessions',
  async () => {
    const { env, auth } = setup();

    const signup = await auth('/signup', {
      email: 'fan@example.com',
      password: 'a very long secure password',
    });

    assert.equal(signup.status, 201);

    const bad = await auth('/login', {
      email: 'fan@example.com',
      password: 'wrong password',
    });

    assert.equal(bad.status, 401);

    const login = await auth('/login', {
      email: 'fan@example.com',
      password: 'a very long secure password',
    });

    assert.equal(login.status, 200);
    assert.ok(login.body.token);

    const request = new Request(
      'https://test/api/community/me',
      {
        headers: {
          authorization:
            `Bearer ${login.body.token}`,
        },
      },
    );

    const identity =
      await verifyCommunitySession(
        request,
        env,
      );

    assert.ok(identity);
    assert.match(
      identity.subject,
      /^community-account:/,
    );
    assert.equal(
      identity.communityEligible,
      false,
    );
    assert.equal(
      identity.isChild,
      undefined,
    );

    const logout = await auth(
      '/logout',
      {},
      login.body.token,
    );

    assert.equal(logout.status, 200);

    const after =
      await verifyCommunitySession(
        request,
        env,
      );

    assert.equal(after, null);
  },
);

test(
  'Community login rate limits repeated failures',
  async () => {
    const { auth } = setup();

    await auth('/signup', {
      email: 'rate@example.com',
      password: 'another secure password',
    });

    for (let i = 0; i < 5; i += 1) {
      const attempt = await auth('/login', {
        email: 'rate@example.com',
        password: 'definitely wrong',
      });

      assert.equal(attempt.status, 401);
    }

    const blocked = await auth('/login', {
      email: 'rate@example.com',
      password: 'another secure password',
    });

    assert.equal(blocked.status, 429);
  },
);

test(
  'Community email verification uses hashed single-use tokens',
  async () => {
    const { db, env, auth } = setup();
    const deliveries = [];

    env.COMMUNITY_EMAIL = {
      async fetch(request) {
        deliveries.push(await request.json());
        return new Response('ok');
      },
    };

    const signup = await auth('/signup', {
      email: 'verify@example.com',
      password: 'verification password',
    });

    assert.equal(signup.status, 201);

    const requested = await auth(
      '/verification/request',
      {},
      signup.body.token,
    );

    assert.equal(requested.status, 200);
    assert.equal(deliveries.length, 1);
    assert.equal(deliveries[0].type, 'verify-email');

    const rawToken = deliveries[0].token;
    const stored = JSON.stringify(
      db.prepare(
        'SELECT * FROM community_account_tokens',
      ).all(),
    );

    assert.equal(stored.includes(rawToken), false);

    const confirmed = await auth(
      '/verification/confirm',
      { token: rawToken },
    );

    assert.equal(confirmed.status, 200);
    assert.equal(confirmed.body.emailVerified, true);

    const replay = await auth(
      '/verification/confirm',
      { token: rawToken },
    );

    assert.equal(replay.status, 400);

    const account = db.prepare(
      `SELECT email_verified
       FROM community_accounts
       WHERE email_normalized=?`,
    ).get('verify@example.com');

    assert.equal(account.email_verified, 1);
  },
);

test(
  'Community password reset is generic, single-use and revokes sessions',
  async () => {
    const { env, auth } = setup();
    const deliveries = [];

    env.COMMUNITY_EMAIL = {
      async fetch(request) {
        deliveries.push(await request.json());
        return new Response('ok');
      },
    };

    const signup = await auth('/signup', {
      email: 'recover@example.com',
      password: 'original secure password',
    });

    const unknown = await auth('/password/forgot', {
      email: 'unknown@example.com',
    });

    const known = await auth('/password/forgot', {
      email: 'recover@example.com',
    });

    assert.equal(unknown.status, 200);
    assert.equal(known.status, 200);
    assert.equal(unknown.body.message, known.body.message);

    const reset = deliveries.find(
      item => item.type === 'password-reset',
    );

    assert.ok(reset);

    const changed = await auth('/password/reset', {
      token: reset.token,
      password: 'replacement secure password',
    });

    assert.equal(changed.status, 200);
    assert.equal(changed.body.signedIn, false);

    const oldSession = await auth(
      '/session',
      undefined,
      signup.body.token,
    );

    assert.equal(oldSession.status, 401);

    const oldPassword = await auth('/login', {
      email: 'recover@example.com',
      password: 'original secure password',
    });

    assert.equal(oldPassword.status, 401);

    const newPassword = await auth('/login', {
      email: 'recover@example.com',
      password: 'replacement secure password',
    });

    assert.equal(newPassword.status, 200);

    const replay = await auth('/password/reset', {
      token: reset.token,
      password: 'another replacement password',
    });

    assert.equal(replay.status, 400);
  },
);

test(
  'Community account deletion removes authentication and associated Community data',
  async () => {
    const { db, auth } = setup();

    const signup = await auth('/signup', {
      email: 'delete@example.com',
      password: 'delete account password',
    });

    assert.equal(signup.status, 201);

    const account = db.prepare(
      `SELECT id
       FROM community_accounts
       WHERE email_normalized=?`,
    ).get('delete@example.com');

    const subject = `community-account:${account.id}`;

    db.prepare(
      `INSERT INTO community_members(
        id,subject,display_name,avatar,club_id
      ) VALUES(?,?,?,?,?)`,
    ).run(
      'delete-member',
      subject,
      'Delete Me',
      '⚽',
      'club:test',
    );

    db.prepare(
      `INSERT INTO community_members(
        id,subject,display_name,avatar,club_id
      ) VALUES(?,?,?,?,?)`,
    ).run(
      'peer-member',
      'peer-subject',
      'Peer',
      '⚽',
      'club:test',
    );

    db.prepare(
      `INSERT INTO community_relationships(
        id,sender,recipient,status
      ) VALUES(?,?,?,'accepted')`,
    ).run(
      'delete-relationship',
      'delete-member',
      'peer-member',
    );

    db.prepare(
      `INSERT INTO community_blocks(
        blocker,blocked
      ) VALUES(?,?)`,
    ).run('delete-member', 'peer-member');

    db.prepare(
      `INSERT INTO community_reports(
        id,reporter,reported,reason,created_at
      ) VALUES(?,?,?,?,?)`,
    ).run(
      'delete-report',
      'delete-member',
      'peer-member',
      'test',
      Date.now(),
    );

    db.prepare(
      `INSERT INTO community_messages(
        id,sender,recipient,body,created_at
      ) VALUES(?,?,?,?,?)`,
    ).run(
      'delete-message',
      'delete-member',
      'peer-member',
      'test message',
      Date.now(),
    );

    const deleted = await auth(
      '/account/delete',
      {
        confirmation: 'DELETE',
        password: 'delete account password',
      },
      signup.body.token,
    );

    assert.equal(deleted.status, 200);
    assert.equal(deleted.body.deleted, true);

    assert.equal(
      db.prepare(
        `SELECT COUNT(*) count
         FROM community_accounts
         WHERE id=?`,
      ).get(account.id).count,
      0,
    );

    assert.equal(
      db.prepare(
        `SELECT COUNT(*) count
         FROM community_members
         WHERE id='delete-member'`,
      ).get().count,
      0,
    );

    for (const table of [
      'community_relationships',
      'community_blocks',
      'community_reports',
      'community_messages',
    ]) {
      assert.equal(
        db.prepare(
          `SELECT COUNT(*) count FROM ${table}
           WHERE ${
             table === 'community_blocks'
               ? "blocker='delete-member' OR blocked='delete-member'"
               : table === 'community_relationships'
                 ? "sender='delete-member' OR recipient='delete-member'"
                 : table === 'community_reports'
                   ? "reporter='delete-member' OR reported='delete-member'"
                   : "sender='delete-member' OR recipient='delete-member'"
           }`,
        ).get().count,
        0,
      );
    }

    const session = await auth(
      '/session',
      undefined,
      signup.body.token,
    );

    assert.equal(session.status, 401);
  },
);
