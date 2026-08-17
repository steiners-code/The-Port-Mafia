"use client";

import { CheckCircleIcon } from "@phosphor-icons/react";
import { Textarea } from "@/components/ui/textarea";
import { QuestionnaireTask } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ChangeEvent, useState } from "react";

type AnswerInput = {
    index: number,
    answer: string | null
}[]

const QuestionnaireForm = ({ content }: { content: QuestionnaireTask["content"] }) => {
    const [formData, setFormData] = useState<AnswerInput>(content.map(c => ({ index: c.index, answer: c.answer })))

    const handleChange = (e: ChangeEvent<HTMLTextAreaElement>, index: number) => {
        const value = e.target.value;
        setFormData((prev) => {
            const exists = prev.some((item) => item.index === index);
            if (exists) {
                return prev.map((item) =>
                    item.index === index ? { ...item, answer: value } : item
                );
            }
            return [...prev, { index, answer: value }];
        });
    }

    const handleSubmit = () => {

    }

    return (
        <div className="space-y-8 group/form">
            {content.map(c => (
                <div key={c.index} className="flex items-start group/question">
                    <span className="font-serif font-semibold">{c.index}.</span>
                    <div className="flex flex-col gap-2 items-start">
                        <p className="px-2 text-foreground group-hover/form:text-muted-foreground group-hover/question:text-foreground transition-colors">{c.question}</p>

                        <Textarea
                            className="bg-transparent! h-fit! min-h-fit! ring-0! border-0! border-b-2! rounded-none! text-[1rem]! resize-none! text-inherit! group-hover/form:text-muted-foreground! focus:text-inherit! group-hover/question:text-inherit! border-inherit!"
                            value={formData.find((item) => item.index === c.index)?.answer || ""}
                            onChange={(e) => handleChange(e, c.index)}
                            placeholder="Your Answer"
                        />
                    </div>
                </div>
            ))}

            <Button
                type="submit"
                variant="secondary"
                className=""
                onClick={handleSubmit}
            >
                <CheckCircleIcon size={16} />
                <span>Mark Complete</span>
            </Button>
        </div >
    )
}

export default QuestionnaireForm
