import { useEffect, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { communityRequest } from "@/lib/community/api";
import type { Message, PublicProfile, Relationship } from "@/lib/community/model";
import { Action, styles } from "./Controls";

type Thread = {
  friend: PublicProfile;
  unread: number;
};

export default function Messages({
  enabled,
  busy,
  run,
}: {
  enabled: boolean;
  busy: boolean;
  run(task: () => Promise<void>): Promise<void>;
}) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [friend, setFriend] = useState<PublicProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setThreads([]);
    setFriend(null);
    setMessages([]);
    setBody("");
    setNotice("");
  }, [enabled]);

  async function refreshThreads() {
    const result = await communityRequest<{ conversations: Thread[] }>("/conversations");
    setThreads(result.conversations);

    if (friend && !result.conversations.some(item => item.friend.id === friend.id)) {
      setFriend(null);
      setMessages([]);
    }
  }

  async function openThread(profile: PublicProfile) {
    const result = await communityRequest<{ messages: Message[] }>(
      `/messages?friend=${encodeURIComponent(profile.id)}`,
    );
    setFriend(profile);
    setMessages(result.messages);
    setNotice("");
    await refreshThreads();
  }

  async function send() {
    if (!friend) return;
    const text = body.trim();
    if (!text) return;

    await communityRequest("/message", {
      target: friend.id,
      body: text,
    });

    setBody("");
    await openThread(friend);
  }

  if (!enabled) return null;

  return (
    <>
      <Text style={styles.heading}>Messages</Text>
      <Text style={styles.copy}>
        Messaging is private to accepted friends from your favourite club. Blocking or
        unfriending ends messaging access.
      </Text>

      <Action
        title="Refresh messages"
        disabled={busy}
        onPress={() => void run(refreshThreads)}
      />

      {!friend && threads.length === 0 && (
        <Text>No friend conversations yet.</Text>
      )}

      {!friend &&
        threads.map(thread => (
          <View key={thread.friend.id} style={{ gap: 8 }}>
            <Text style={{ fontWeight: "700" }}>
              {thread.friend.avatar} {thread.friend.displayName}
              {thread.unread ? ` · ${thread.unread} unread` : ""}
            </Text>
            <Text>
              {thread.friend.gamesAttended} games · {thread.friend.groundsVisited.length} grounds
            </Text>
            <Action
              title={`Message ${thread.friend.displayName}`}
              disabled={busy}
              onPress={() => void run(() => openThread(thread.friend))}
            />
          </View>
        ))}

      {friend && (
        <View style={{ gap: 10 }}>
          <Text style={{ fontWeight: "700" }}>
            {friend.avatar} {friend.displayName}
          </Text>

          <ScrollView
            style={{ maxHeight: 320 }}
            contentContainerStyle={{ gap: 8 }}
            nestedScrollEnabled
          >
            {messages.length === 0 && <Text>No messages yet.</Text>}
            {messages.map(message => (
              <View key={message.id} style={{ gap: 3 }}>
                <Text style={{ fontWeight: "700" }}>
                  {message.sender === friend.id ? friend.displayName : "You"}
                </Text>
                <Text>{message.body}</Text>
              </View>
            ))}
          </ScrollView>

          <TextInput
            accessibilityLabel={`Message ${friend.displayName}`}
            placeholder="Write a message"
            multiline
            maxLength={1000}
            value={body}
            onChangeText={setBody}
            style={styles.input}
          />

          <Action
            title="Send message"
            disabled={busy || !body.trim()}
            onPress={() => void run(send)}
          />
          <Action
            title="Back to conversations"
            disabled={busy}
            onPress={() => {
              setFriend(null);
              setMessages([]);
              setBody("");
              void run(refreshThreads);
            }}
          />
        </View>
      )}

      {!!notice && <Text accessibilityLiveRegion="polite">{notice}</Text>}
    </>
  );
}
