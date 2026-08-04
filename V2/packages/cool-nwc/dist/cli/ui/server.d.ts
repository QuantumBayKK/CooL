import { type Workspace } from "../workspace.js";
import type { FileChange } from "./watch.js";
interface Row {
    id: string;
    kind: string;
    ref: string;
    path: string | null;
    actor: string;
    environment: string;
    at: string;
    decision: string;
    policyRule: string | null;
    fresh: boolean;
    verdict: {
        ok: boolean;
        checks: {
            domain: string;
            status: string;
            detail: string;
        }[];
    } | null;
    /** Kept in the server's memory only, for the diff pane. Never in the receipt. */
    before: string | null;
    after: string | null;
}
export interface UiOptions {
    readonly workspace: Workspace;
    readonly root: string;
    readonly projectName: string;
    readonly port: number;
    readonly host: string;
    readonly environment: string;
    readonly onLog?: (line: string) => void;
}
export declare class Console {
    private readonly options;
    private readonly rows;
    private readonly receipts;
    private readonly clients;
    private server;
    private git;
    private notes;
    constructor(options: UiOptions);
    /** Note something the operator should see in the UI rather than only in stdout. */
    note(message: string): void;
    /**
     * Adopt what is already on disk.
     *
     * The log and the receipts outlive the process, so opening the console on a
     * project that has been used before must show its history rather than an
     * empty page pretending this is the first change.
     */
    loadExisting(): Promise<number>;
    private verify;
    private rowOf;
    /**
     * Seal a real change from the watcher.
     *
     * No approval block is passed: the plane's policy set decides inside the
     * enclave and its verdict is sealed by the same signature as the change. That
     * is the property that makes the decision worth anything, and it is why this
     * function does not get to choose the outcome.
     */
    sealChange(change: FileChange): Promise<Row | null>;
    private broadcast;
    private state;
    private route;
    listen(): Promise<string>;
    close(): void;
}
export {};
