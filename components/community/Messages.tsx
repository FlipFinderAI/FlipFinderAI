import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { communityRequest } from "@/lib/community/api";
import type {
  Message,
  PublicProfile,
} from "@/lib/community/model";
import { Action, styles } from "./Controls";

type Thread = {
  friend: PublicProfile;
  unread: number;
  friendType: "matchday" | "full_time";
  canMessage: boolean;
  activeNow: boolean;
};

function initials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "?";

  return parts
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || "")
    .join("");
}

function Avatar({
  profile,
  size = 52,
  activeNow = false,
}: {
  profile: PublicProfile;
  size?: number;
  activeNow?: boolean;
}) {
  return (
    <View
      accessibilityLabel={`${profile.displayName} avatar`}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "#e9e4d7",
        borderWidth: 1,
        borderColor: "#d5cfc0",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          fontSize: Math.max(16, size * 0.34),
          fontWeight: "900",
          color: "#17221c",
        }}
      >
        {initials(profile.displayName)}
      </Text>

      {activeNow && (
        <View
          accessibilityLabel={`${profile.displayName} active now`}
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            width: Math.max(13, size * 0.28),
            height: Math.max(13, size * 0.28),
            borderRadius: Math.max(13, size * 0.28) / 2,
            backgroundColor: "#2fb344",
            borderWidth: 2,
            borderColor: "#ffffff",
          }}
        />
      )}
    </View>
  );
}

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
    const result = await communityRequest<{
      conversations: Thread[];
    }>("/conversations");

    setThreads(result.conversations);

    if (friend) {
      const current = result.conversations.find(
        item => item.friend.id === friend.id,
      );

      if (!current || !current.canMessage) {
        setFriend(null);
        setMessages([]);

        if (current?.friendType === "matchday") {
          setNotice(
            "That Matchday Friend conversation is locked outside an eligible matchday.",
          );
        }
      }
    }
  }

  async function openThread(profile: PublicProfile) {
    const result = await communityRequest<{
      messages: Message[];
    }>(
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

  const activeThread = friend
    ? threads.find(thread => thread.friend.id === friend.id)
    : undefined;

  if (friend) {
    return (
      <View
        style={{
          gap: 12,
          backgroundColor: "#f8f5ec",
          borderRadius: 18,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "#ddd6c8",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            padding: 14,
            backgroundColor: "#ffffff",
            borderBottomWidth: 1,
            borderBottomColor: "#e4ded2",
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to conversations"
            disabled={busy}
            onPress={() => {
              setFriend(null);
              setMessages([]);
              setBody("");
              void run(refreshThreads);
            }}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#eee9dd",
            }}
          >
            <Text
              style={{
                fontSize: 24,
                fontWeight: "900",
                color: "#17221c",
              }}
            >
              ‹
            </Text>
          </Pressable>

          <Avatar
            profile={friend}
            size={46}
            activeNow={activeThread?.activeNow === true}
          />

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 17,
                fontWeight: "900",
                color: "#17221c",
              }}
              numberOfLines={1}
            >
              {friend.displayName}
            </Text>

            <Text
              style={{
                fontSize: 12,
                color:
                  activeThread?.activeNow === true
                    ? "#237a3b"
                    : "#68645c",
                fontWeight:
                  activeThread?.activeNow === true
                    ? "700"
                    : "400",
                marginTop: 2,
              }}
            >
              {activeThread?.activeNow === true
                ? "Active now"
                : "Community friend"}
            </Text>
          </View>
        </View>

        <ScrollView
          style={{
            minHeight: 260,
            maxHeight: 430,
          }}
          contentContainerStyle={{
            padding: 14,
            gap: 8,
          }}
          nestedScrollEnabled
        >
          {messages.length === 0 && (
            <Text
              style={{
                textAlign: "center",
                color: "#777168",
                marginVertical: 28,
              }}
            >
              No messages yet. Say hello.
            </Text>
          )}

          {messages.map(message => {
            const mine = message.sender !== friend.id;

            return (
              <View
                key={message.id}
                style={{
                  alignSelf: mine ? "flex-end" : "flex-start",
                  maxWidth: "82%",
                  backgroundColor: mine
                    ? "#dfead8"
                    : "#ffffff",
                  borderRadius: 18,
                  paddingHorizontal: 13,
                  paddingVertical: 9,
                  borderWidth: 1,
                  borderColor: mine
                    ? "#c9d9c0"
                    : "#e1dbcf",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    lineHeight: 21,
                    color: "#17221c",
                  }}
                >
                  {message.body}
                </Text>

                <Text
                  style={{
                    fontSize: 10,
                    color: "#777168",
                    marginTop: 4,
                    textAlign: mine ? "right" : "left",
                  }}
                >
                  {new Date(message.createdAt).toLocaleTimeString(
                    [],
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            gap: 8,
            padding: 10,
            backgroundColor: "#ffffff",
            borderTopWidth: 1,
            borderTopColor: "#e4ded2",
          }}
        >
          <TextInput
            accessibilityLabel={`Message ${friend.displayName}`}
            placeholder="Message"
            multiline
            maxLength={1000}
            value={body}
            onChangeText={setBody}
            style={[
              styles.input,
              {
                flex: 1,
                marginBottom: 0,
                maxHeight: 110,
                borderRadius: 20,
                paddingHorizontal: 14,
              },
            ]}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send message"
            disabled={busy || !body.trim()}
            onPress={() => void run(send)}
            style={({ pressed }) => ({
              minWidth: 58,
              height: 44,
              borderRadius: 22,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 14,
              backgroundColor:
                busy || !body.trim()
                  ? "#d8d4cb"
                  : "#17221c",
              opacity: pressed ? 0.72 : 1,
            })}
          >
            <Text
              style={{
                color:
                  busy || !body.trim()
                    ? "#777168"
                    : "#ffffff",
                fontWeight: "900",
              }}
            >
              Send
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={{ gap: 10 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <Text
          style={[
            styles.heading,
            {
              marginBottom: 0,
              fontSize: 22,
            },
          ]}
        >
          Messages
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Refresh messages"
          disabled={busy}
          onPress={() => void run(refreshThreads)}
          style={({ pressed }) => ({
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderRadius: 16,
            backgroundColor: "#eee9dd",
            opacity: pressed ? 0.65 : 1,
          })}
        >
          <Text
            style={{
              fontWeight: "800",
              color: "#17221c",
            }}
          >
            Refresh
          </Text>
        </Pressable>
      </View>

      {threads.length === 0 ? (
        <View
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 16,
            padding: 18,
            borderWidth: 1,
            borderColor: "#e1dbcf",
          }}
        >
          <Text
            style={{
              textAlign: "center",
              fontWeight: "700",
              color: "#68645c",
            }}
          >
            No conversations yet
          </Text>
        </View>
      ) : (
        <View
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 18,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: "#e1dbcf",
          }}
        >
          {threads.map((thread, index) => (
            <Pressable
              key={thread.friend.id}
              accessibilityRole="button"
              accessibilityLabel={
                thread.canMessage
                  ? `Open conversation with ${thread.friend.displayName}`
                  : `${thread.friend.displayName} messaging locked`
              }
              disabled={busy || !thread.canMessage}
              onPress={() =>
                void run(() => openThread(thread.friend))
              }
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderTopWidth: index === 0 ? 0 : 1,
                borderTopColor: "#eee8dc",
                opacity: !thread.canMessage
                  ? 0.5
                  : pressed
                    ? 0.65
                    : 1,
              })}
            >
              <Avatar
                profile={thread.friend}
                activeNow={thread.activeNow === true}
              />

              <View style={{ flex: 1, minWidth: 0 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 16,
                      fontWeight: "900",
                      color: "#17221c",
                    }}
                    numberOfLines={1}
                  >
                    {thread.friend.displayName}
                  </Text>

                  {!!thread.unread && (
                    <View
                      style={{
                        minWidth: 22,
                        height: 22,
                        borderRadius: 11,
                        paddingHorizontal: 6,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#17221c",
                      }}
                    >
                      <Text
                        style={{
                          color: "#ffffff",
                          fontSize: 11,
                          fontWeight: "900",
                        }}
                      >
                        {thread.unread}
                      </Text>
                    </View>
                  )}
                </View>

                <Text
                  style={{
                    marginTop: 3,
                    fontSize: 13,
                    color: thread.canMessage
                      ? "#68645c"
                      : "#9a574f",
                  }}
                  numberOfLines={1}
                >
                  {thread.friendType === "full_time"
                    ? "Full-Time Friend"
                    : thread.canMessage
                      ? "Matchday Friend"
                      : "Matchday messaging currently locked"}
                </Text>
              </View>

              {thread.canMessage && (
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: "700",
                    color: "#aaa397",
                  }}
                >
                  ›
                </Text>
              )}
            </Pressable>
          ))}
        </View>
      )}

      <Text
        style={{
          fontSize: 12,
          lineHeight: 17,
          color: "#777168",
        }}
      >
        Full-Time Friends can message at any time. Matchday Friend
        conversations open only during an eligible matchday or active
        Matchday Experience.
      </Text>

      {!!notice && (
        <Text accessibilityLiveRegion="polite">
          {notice}
        </Text>
      )}
    </View>
  );
}
