import { useEffect, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { communityRequest } from "@/lib/community/api";
import type { Message, PublicProfile, Relationship } from "@/lib/community/model";
import { Action, styles } from "./Controls";

type Thread = {
  friend: PublicProfile;
  unread: number;
  friendType: "matchday" | "full_time";
  canMessage: boolean;
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

    if (friend) {
      const current = result.conversations.find(
        item => item.friend.id === friend.id
      );

      if (!current || !current.canMessage) {
        setFriend(null);
        setMessages([]);

        if (current?.friendType === "matchday") {
          setNotice(
            "That Matchday Friend conversation is locked outside an eligible matchday."
          );
        }
      }
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
        Full-Time Friends can message at any time. Matchday Friends can message only
        during an eligible matchday or Matchday Experience. Blocking or unfriending
        ends messaging access. Phone numbers cannot be shared in Community messages.
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
            <Text>
              {thread.friendType === "full_time"
                ? "Full-Time Friend"
                : "Matchday Friend"}
            </Text>

            {thread.friendType === "matchday" && !thread.canMessage && (
              <Text>
                Messaging unlocks during an eligible matchday or Matchday Experience.
              </Text>
            )}

            <Action
              title={
                thread.canMessage
                  ? `Message ${thread.friend.displayName}`
                  : "Matchday messaging locked"
              }
              disabled={busy || !thread.canMessage}
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
