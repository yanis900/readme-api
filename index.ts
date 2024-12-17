import { Hono } from "hono";
import OpenAI from "openai";
import { env } from "hono/adapter";
import { cors } from "hono/cors";

const app = new Hono();

type Environment = {
  OPENAI_API_KEY: string;
};

app.use(cors());

app.post("/", async (c) => {
  if (c.req.header("Content-Type") !== "application/json") {
    return c.json({ error: "JSON body expected" }, { status: 406 });
  }

  try {
    const { OPENAI_API_KEY } = env<Environment>(c);
    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });

    const body = await c.req.json();
    const { content } = body as { content?: string };

    if (!content) {
      return c.json(
        { error: "'content' field is required in the JSON body." },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `Create a README file using markdown based on this src directory:\n${content}`,
        },
      ],
    });

    const readmeContent = completion.choices[0]?.message.content;
    if (!readmeContent) {
      return c.json(
        { error: "Failed to generate README content." },
        { status: 500 }
      );
    }

    console.log(`README created successfully`);
    return c.text(readmeContent);
  } catch (err) {
    console.error("Error generating README:", err);
    return c.json(
      { error: "Internal server error. Please try again later." },
      { status: 500 }
    );
  }
});

export default app;
