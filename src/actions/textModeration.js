"use server";

export default async function textModeration(
  userPrompt
) {
  try {
    if (!process.env.AZURE_CONTENT_SAFETY_ENDPOINT) {
      throw new Error(
        "Missing environment variable: AZURE_CONTENT_SAFETY_ENDPOINT"
      );
    }
    if (!process.env.AZURE_CONTENT_SAFETY_KEY) {
      throw new Error("Missing environment variable: AZURE_CONTENT_SAFETY_KEY");
    }
    const key = process.env.AZURE_CONTENT_SAFETY_KEY;

    const urlTextModeration = `${process.env.AZURE_CONTENT_SAFETY_ENDPOINT}/text:analyze?api-version=2023-10-01`;

    const textModerationResponse = await fetch(urlTextModeration, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Ocp-Apim-Subscription-Key": key,
      },
      body: JSON.stringify({
        text: userPrompt,
        categories: ["Hate", "Sexual", "SelfHarm", "Violence"],
        haltOnBlocklistHit: false,
        outputType: "FourSeverityLevels",
      }),
    });

    if (!textModerationResponse.ok) {
      throw new Error("Failed to moderate text");
    }

    const textModerationResponseBody =
      await textModerationResponse.json();
    const { categoriesAnalysis } = textModerationResponseBody;
    let returnCategoriesAnalysis = {};
    categoriesAnalysis.forEach((category) => {
      returnCategoriesAnalysis[category.category] = category.severity;
    });

    return {
      returnCategoriesAnalysis,
    };
  } catch (error) {
    console.error(error);
    return null;
  }
}
