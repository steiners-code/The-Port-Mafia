import { getFileContent } from "@/actions/chat/get-file-content";
import { MarkdownContent } from "../MarkdownContent";
import { useQuery } from "@tanstack/react-query";
import { File } from "@/lib/types/media";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const MediaFile = ({ fileType }: { userId: string, fileType: File["fileType"] }) => {
    const { data, isLoading } = useQuery({
        queryKey: ["file-content", fileType],
        queryFn: async () => {
            const res = await getFileContent(fileType);
            if (!res.success) toast.error(res.message);
            return res.data;
        },
        enabled: fileType !== null,
    });

    if (!data && isLoading)
        return (
            <div className="w-full h-screen flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="animate-spin size-5!" />
                <span>Loading...</span>
            </div>
        )

    if (!data) {
        return (
            <div className="w-full h-full flex items-center justify-between gap-2 text-muted-foreground">
                Nothing to show
            </div>
        )
    }

    return (
        <div className="text-foreground">
            <MarkdownContent content={data} />
        </div>
    )
}

export default MediaFile
