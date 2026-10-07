import { ToolContext } from "../definitions";
import path from "path";

let aboutProject: string | null = null

export async function readAboutThePortMafia(args: {}, context: ToolContext) {
    if (aboutProject === null) {
        aboutProject = await Bun.file(
            path.join(process.cwd(), "public", "ABOUT_THE_PORT_MAFIA.md")
        ).text();
    }

    return { content: aboutProject };
}