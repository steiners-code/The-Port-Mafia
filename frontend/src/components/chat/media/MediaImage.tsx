import Image from "next/image"

const MediaImage = ({ url }: { url: string }) => {
    return (
        <Image
            src={url}
            alt={url}
            width={520}
            height={520}
            className="w-full aspect-auto object-cover"
        />
    )
}

export default MediaImage
