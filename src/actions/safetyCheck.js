"use server";
import promptShield from "./promptShield";
import textModeration from "./textModeration";

export default async function safetyCheck(
  userPrompt
) {
  try {
   // Prompt Shields
   const attackDetected = await promptShield(userPrompt);
   console.log(attackDetected)

   // Text Moderation
   const returnCategoriesAnalysis =  await textModeration(userPrompt);
   console.log(returnCategoriesAnalysis)

   // Return the results
    return {
      attackDetected,
      returnCategoriesAnalysis,
    };

  } catch (error) {
    console.error(error);
    return null;
  }
}
