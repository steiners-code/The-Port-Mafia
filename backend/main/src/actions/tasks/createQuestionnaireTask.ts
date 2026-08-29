import { Question, QuestionnaireTaskBody } from "../../lib/types";

export function createQuestionnaireTask(questions: QuestionnaireTaskBody["questions"]): Question[] {
    try {
        const content: Question[] = questions.map((question, index) => ({
            index: index + 1,
            question,
            answer: null,
            answeredBy: null,
        }))

        return content;
    } catch (error) {
        console.error(error);
        throw new Error("Unable to create questionnaire.")
    }
}