import { getStatusColor } from "./index";
import { supabase } from "./index";
// import { createClient } from "@supabase/supabase-js";

interface MiroSelection {
  content: string;
  x: number;
  y: number;
}

export const insertAppCards = async (
  selection: MiroSelection,
  selectedColor: { background: string }
) => {
  await miro.board.createAppCard({
    title: selection.content,
    description: "Github App Card Created",
    x: selection.x,
    y: selection.y,
    style: {
      cardTheme: selectedColor.background,
    },
  });
};

export const removeSelectedItem = async (item: any) => {
  await miro.board.remove(item);
};

export const insertGitHubAppCards = async (gitHubIssues: any[]) => {
  await Promise.all(
    gitHubIssues.map(async (issue, index) => {
      // Get status color
      const color = await getStatusColor(issue.status.name);

      // Create App Card
      const appCard = await miro.board.createAppCard({
        x: index * 350,
        y: 0,
        title: issue.title,
        description: issue.body,
        style: {
          cardTheme: color,
        },
        fields: [
          {
            value: issue.status.name,
            iconShape: "square",
            fillColor: color,
            textColor: "#ffffff",
          },
        ],
        status: "connected",
      });

      // Post data to supabase
      await supabase.from("card-mapping").insert([
        {
          miroAppCardId: appCard.id,
          gitHubIssueId: issue.id,
          miroUserId: appCard.createdBy,
          gitHubUsername: issue.user.login,
        },
      ]);
    })
  );
};
