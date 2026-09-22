export { cn } from "cn"

export function decodeParam(param: string): string {
    try {
        return decodeURIComponent(param);
    } catch {
        return param;
    }
}
