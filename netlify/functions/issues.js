/* 

  This endpoint updates Miro App Cards when there is an update to their information
  in GitHub (i.e. if the title or description is updated)

**/
import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import fetch from "node-fetch";

const supabase = createClient(
  process.env.VITE_DATABASE_URL,
  process.env.VITE_DATABASE_PUBLIC_KEY
);

exports.handler = async function (event, context, callback) {
  console.log("env", process.env.VITE_MIRO_API_TOKEN);

  // Get Issue
  const body = JSON.parse(event.body);
  const gitHubIssue = body.gitHubIssue;
  const gitHubIssueId = gitHubIssue.id;

  //   Request Headers
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.VITE_MIRO_API_TOKEN}`,
  };

  //   Request body
  const options = {
    method: "PATCH",
    headers: headers,
    body: JSON.stringify({
      data: {
        title: gitHubIssue.title,
        description: gitHubIssue.body,
      },
    }),
  };

  //   Get card mappings from database
  const { data, error } = await supabase
    .from("card-mapping")
    .select(
      "id, miroAppCardId::text, gitHubIssueId, miroUserId::text, gitHubUsername, created_at, miroBoardId"
    )
    .eq("gitHubIssueId", gitHubIssueId);

  //   No Miro App Card Found
  if (error) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "No Miro App Card found for this issue",
      }),
    };
  }

  // Matching App Cards found
  if (data) {
    data.map(async (item) => {
      //   return new Promise((resolve, reject) => {
      //   fetch(
      //     `https://api.miro.com/v2/boards/${item.miroBoardId}/app_cards/${item.miroAppCardId}`,
      //     options
      //   )
      //       .then((res) => {
      //         if (res.ok) {
      //           return res.json();
      //         } else {
      //           resolve({ statusCode: res.status || 500, body: res.statusText });
      //         }
      //       })
      //       .then((data) => {
      //         const response = {
      //           statusCode: 200,
      //           headers: { "content-type": "application/json" },
      //           body: JSON.stringify(data),
      //         };
      //         resolve(response);
      //       })
      //       .catch((err) => {
      //         console.log(err);
      //         resolve({ statusCode: err.statusCode || 500, body: err.message });
      //       });
      //   });
      const checkStatus = (res) => {
        if (res.ok) {
          // res.status >= 200 && res.status < 300
          return res.json();
        } else {
          throw new Error(res.statusText);
        }
      };

      try {
        console.log(
          "Sending request to: ",
          `https://api.miro.com/v2/boards/${item.miroBoardId}/app_cards/${item.miroAppCardId}`
        );

        const response = await fetch(
          `https://api.miro.com/v2/boards/${item.miroBoardId}/app_cards/${item.miroAppCardId}`,
          options
        );
        console.log("response", response);

        const data = await checkStatus(response);

        console.log("data", data);

        callback(null, {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } catch (error) {
        callback(error);
      }
    });
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Issues Endpoint" }),
  };
};
