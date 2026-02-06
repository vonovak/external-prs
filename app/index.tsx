import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { config } from "@/config";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";

interface PullRequest {
  id: number;
  number: number;
  title: string;
  user: {
    login: string;
    avatar_url: string;
  };
  html_url: string;
  created_at: string;
  updated_at: string;
  state: string;
  labels: {
    name: string;
    color: string;
  }[];
  assignees: {
    login: string;
    avatar_url: string;
  }[];
  requested_reviewers: {
    login: string;
    avatar_url: string;
  }[];
}

export default function HomeScreen() {
  const [prs, setPrs] = useState<PullRequest[]>([]);
  const [allPrs, setAllPrs] = useState<PullRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [excludedAuthors, setExcludedAuthors] = useState<string[]>(
    config.excludedAuthors
  );
  const [newAuthor, setNewAuthor] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    fetchPullRequests();
  }, []);

  useEffect(() => {
    // Re-filter PRs when excluded authors change
    filterPRs();
  }, [excludedAuthors, allPrs]);

  const fetchPullRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const fetchedPrs: PullRequest[] = [];

      for (let page = 1; page <= config.maxPages; page++) {
        const url = `https://api.github.com/repos/${config.repo.owner}/${config.repo.name}/pulls?state=open&per_page=${config.perPage}&page=${page}`;

        const headers: HeadersInit = {
          Accept: "application/vnd.github.v3+json",
        };

        // Add GitHub token if available (helps with rate limiting)
        if (process.env.GITHUB_TOKEN) {
          headers["Authorization"] = `token ${process.env.GITHUB_TOKEN}`;
        }

        const response = await fetch(url, { headers });

        if (!response.ok) {
          throw new Error(
            `GitHub API error: ${response.status} ${response.statusText}`
          );
        }

        const data: PullRequest[] = await response.json();

        if (data.length === 0) {
          break; // No more PRs to fetch
        }

        fetchedPrs.push(...data);

        // Update state incrementally after each page
        setAllPrs([...fetchedPrs]);
        setLoading(false); // Hide loading after first page
      }

      setAllPrs(fetchedPrs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const filterPRs = () => {
    const filteredPrs = allPrs.filter(
      (pr) => !excludedAuthors.includes(pr.user.login)
    );
    setPrs(filteredPrs);
  };

  const addExcludedAuthor = () => {
    const trimmedAuthor = newAuthor.trim();
    if (trimmedAuthor && !excludedAuthors.includes(trimmedAuthor)) {
      setExcludedAuthors([...excludedAuthors, trimmedAuthor]);
      setNewAuthor("");
    }
  };

  const removeExcludedAuthor = (author: string) => {
    setExcludedAuthors(excludedAuthors.filter((a) => a !== author));
  };

  const openPR = (url: string) => {
    Linking.openURL(url);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>
          Loading pull requests...
        </ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.errorTitle}>
          Error
        </ThemedText>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <Pressable style={styles.retryButton} onPress={fetchPullRequests}>
          <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.scrollView}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedView style={styles.titleRow}>
            <ThemedView style={styles.titleInfo}>
              <ThemedText type="defaultSemiBold" style={styles.title}>
                Expo external PRs
              </ThemedText>
              <ThemedText style={styles.count}>
                ({prs.length} of {allPrs.length})
              </ThemedText>
            </ThemedView>
            <Pressable
              style={styles.settingsButton}
              onPress={() => setShowSettings(!showSettings)}
            >
              <ThemedText style={styles.settingsButtonText}>
                {showSettings ? "✕" : "⚙"}
              </ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>

        {showSettings && (
          <ThemedView style={styles.settingsPanel}>
            <ThemedView style={styles.addAuthorContainer}>
              <TextInput
                style={styles.input}
                placeholder="GitHub username"
                placeholderTextColor="#999"
                value={newAuthor}
                onChangeText={setNewAuthor}
                onSubmitEditing={addExcludedAuthor}
              />
              <Pressable style={styles.addButton} onPress={addExcludedAuthor}>
                <ThemedText style={styles.addButtonText}>+</ThemedText>
              </Pressable>
            </ThemedView>

            {excludedAuthors.length > 0 && (
              <ThemedView style={styles.authorsList}>
                {excludedAuthors.map((author) => (
                  <ThemedView key={author} style={styles.authorChip}>
                    <ThemedText style={styles.authorName}>{author}</ThemedText>
                    <Pressable onPress={() => removeExcludedAuthor(author)}>
                      <ThemedText style={styles.removeButtonText}>✕</ThemedText>
                    </Pressable>
                  </ThemedView>
                ))}
              </ThemedView>
            )}
          </ThemedView>
        )}

        {prs.map((pr) => (
          <ThemedView key={pr.id} style={styles.prCard}>
            <a
              href={pr.html_url}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.prTitleSectionLink}
            >
              <ThemedText style={styles.prNumber}>#{pr.number} </ThemedText>
              <ThemedText style={styles.prTitle} numberOfLines={1}>
                {pr.title}
              </ThemedText>
            </a>
            <ThemedText style={styles.date}>
              {formatDate(pr.created_at)}
            </ThemedText>
            <a
              href={`https://github.com/${pr.user.login}`}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.authorLinkWrapper}
            >
              <ThemedText style={styles.authorLink}>{pr.user.login}</ThemedText>
            </a>
            {(pr.assignees?.length > 0 || pr.requested_reviewers?.length > 0) && (
              <ThemedView style={styles.metadataContainer as any}>
                {pr.assignees && pr.assignees.length > 0 && (
                  <ThemedView style={styles.metadataRow as any}>
                    <span title="Assigned to">
                      <ThemedText style={styles.metadataLabel as any}>
                        →{" "}
                      </ThemedText>
                    </span>
                    {pr.assignees.map((assignee, index) => (
                      <a
                        key={assignee.login}
                        href={`https://github.com/${assignee.login}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.linkWrapper as any}
                      >
                        <ThemedText style={styles.metadataLink as any}>
                          {assignee.login}
                          {index < pr.assignees.length - 1 ? ", " : ""}
                        </ThemedText>
                      </a>
                    ))}
                  </ThemedView>
                )}
                {pr.requested_reviewers && pr.requested_reviewers.length > 0 && (
                  <ThemedView style={styles.metadataRow as any}>
                    <span title="Reviewers">
                      <ThemedText style={styles.metadataLabel as any}>
                        👁{" "}
                      </ThemedText>
                    </span>
                    {pr.requested_reviewers.map((reviewer, index) => (
                      <a
                        key={reviewer.login}
                        href={`https://github.com/${reviewer.login}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.linkWrapper as any}
                      >
                        <ThemedText style={styles.metadataLink as any}>
                          {reviewer.login}
                          {index < pr.requested_reviewers.length - 1 ? ", " : ""}
                        </ThemedText>
                      </a>
                    ))}
                  </ThemedView>
                )}
              </ThemedView>
            )}
          </ThemedView>
        ))}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 12,
  },
  header: {
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    fontSize: 18,
  },
  count: {
    fontSize: 14,
    opacity: 0.6,
  },
  settingsButton: {
    padding: 4,
  },
  settingsButtonText: {
    fontSize: 18,
  },
  settingsPanel: {
    marginBottom: 12,
    padding: 10,
    borderRadius: 4,
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  addAuthorContainer: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    padding: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#d0d0d0",
    fontSize: 14,
  },
  addButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    justifyContent: "center",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  authorsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  authorChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingLeft: 8,
    paddingRight: 4,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#d0d0d0",
  },
  authorName: {
    fontSize: 13,
  },
  removeButtonText: {
    fontSize: 16,
    color: "#FF3B30",
    paddingHorizontal: 4,
  },
  loadingText: {
    marginTop: 12,
    textAlign: "center",
  },
  errorTitle: {
    marginBottom: 12,
    textAlign: "center",
  },
  errorText: {
    textAlign: "center",
    marginBottom: 20,
    opacity: 0.8,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  prCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    gap: 10,
  },
  prTitleSectionLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    textDecoration: "none",
    color: "inherit",
  },
  prNumber: {
    fontSize: 13,
    opacity: 0.5,
    minWidth: 50,
  },
  prTitle: {
    fontSize: 14,
    flex: 1,
  },
  date: {
    fontSize: 13,
    opacity: 0.5,
    minWidth: 80,
    textAlign: "right",
  },
  linkWrapper: {
    textDecoration: "none" as any,
  } as any,
  authorLinkWrapper: {
    textDecoration: "none" as any,
  } as any,
  authorLink: {
    fontSize: 13,
    opacity: 0.6,
    minWidth: 100,
    textAlign: "right",
    textDecorationLine: "underline" as const,
    color: "#007AFF",
  },
  metadataContainer: {
    flexDirection: "column" as const,
    gap: 2,
  },
  metadataRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
  },
  metadataLabel: {
    fontSize: 13,
    opacity: 0.5,
  },
  metadataLink: {
    fontSize: 13,
    opacity: 0.6,
    textDecorationLine: "underline" as const,
    color: "#007AFF",
  },
});
