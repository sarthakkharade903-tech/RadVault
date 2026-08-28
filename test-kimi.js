const apiKey = "wk-cxPGHKXrq3fI7LOqGVzl0f.ws-JbafhsWhgpVfWmpS3EdKqG";
const ENDPOINT = "https://sarthakkharadeagent2--ep-kimi-k3-server.us-west.modal.direct/v1/chat/completions";

async function test() {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "moonshotai/Kimi-K3",
      messages: [
        { role: "system", content: "You are a medical triage assistant. Respond ONLY with a raw JSON object - no markdown, no code blocks, no explanation. Use format: {\"priority\":\"RED|ORANGE|GREEN\",\"note\":\"2-sentence clinical recommendation\",\"department\":\"Nearest relevant department name\"}" },
        { role: "user", content: "Patient: Pregnant woman. Danger signs: Vaginal bleeding: Yes. Swelling: No." }
      ],
      temperature: 0.1,
      max_tokens: 2000,
    }),
  });
  
  const text = await res.text();
  console.log("STATUS:", res.status);
  console.log("BODY:", text);
}
test();
