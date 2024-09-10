"use server";
import promptShield from "./promptShield";
import textModeration from "./textModeration";

export default async function safetyCheck(
  userPrompt
) {
  try {
   const attackDetected = await promptShield(userPrompt);
   console.log(attackDetected)
   const returnCategoriesAnalysis =  await textModeration(userPrompt);
   console.log(returnCategoriesAnalysis)
    return {
      attackDetected,
      returnCategoriesAnalysis,
    };

  } catch (error) {
    console.error(error);
    return null;
  }
}
