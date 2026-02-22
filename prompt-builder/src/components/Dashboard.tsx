import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabaseClient";

interface SupabasePrompt {
  id: string;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
}

export function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState<SupabasePrompt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrompts();
  }, []);

  async function fetchPrompts() {
    setLoading(true);
    const { data, error } = await supabase
      .from("prompts")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPrompts(data);
    }
    setLoading(false);
  }

  async function handleLogout() {
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="space-y-0.5">
          <h1 className="text-lg font-semibold">Dashboard</h1>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="rounded-lg"
            onClick={() => navigate("/")}
          >
            Open Editor
          </Button>
          <Button
            variant="outline"
            className="rounded-lg"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <h2 className="text-sm font-semibold mb-4">
          Your Saved Prompts ({prompts.length})
        </h2>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading prompts...</p>
        ) : prompts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">
              No prompts saved yet. Open the editor to create your first prompt.
            </p>
            <Button
              className="mt-4 rounded-lg"
              onClick={() => navigate("/")}
            >
              Open Editor
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prompts.map((prompt) => (
              <div
                key={prompt.id}
                className="p-4 rounded-lg border border-border bg-card space-y-2"
              >
                <h3 className="text-sm font-medium truncate">{prompt.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {prompt.content}
                </p>
                {prompt.tags && prompt.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {prompt.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="default"
                        className="rounded-full px-2 py-0.5 text-[10px]"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground">
                  {new Date(prompt.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
