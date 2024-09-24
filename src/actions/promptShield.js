"use server";

export default async function promptShield(
  userPrompt
) {
  try {
    // Check if the required environment variables are set
    if (!process.env.AZURE_CONTENT_SAFETY_ENDPOINT) {
      throw new Error(
        "Missing environment variable: AZURE_CONTENT_SAFETY_ENDPOINT"
      );
    }
    if (!process.env.AZURE_CONTENT_SAFETY_KEY) {
      throw new Error("Missing environment variable: AZURE_CONTENT_SAFETY_KEY");
    }

    // Create a request to the Prompt Shield (text:shieldPrompt) API
    const urlPromptShield = `${process.env.AZURE_CONTENT_SAFETY_ENDPOINT}/text:shieldPrompt?api-version=2024-02-15-preview`;
    const key = process.env.AZURE_CONTENT_SAFETY_KEY;

    const contentSafetyResponse = await fetch(urlPromptShield, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Ocp-Apim-Subscription-Key": key,
      },
      body: JSON.stringify({
        userPrompt: userPrompt,
        documents: [],
      }),
    });

    // Check if the response is successful
    if (!contentSafetyResponse.ok) {
      throw new Error("Failed to check prompt safety");
    }

    // Parse the response
    const contentSafetyResponseBody =
      await contentSafetyResponse.json();
    const attackDetected =
      contentSafetyResponseBody.userPromptAnalysis.attackDetected;

    return {
      attackDetected,
    };
  } catch (error) {
    console.error(error);
    return null;
  }
}
