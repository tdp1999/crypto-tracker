export interface ISeed {
    seed(): Promise<void>;

    rerun?(): Promise<void>;
}
