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
