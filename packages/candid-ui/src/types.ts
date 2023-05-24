import { HttpAgent } from "@dfinity/agent";

export class AnonymousAgent extends HttpAgent {}

export type LogLevel = "none" | "debug";

export type Options = {
  defaultValues?: DefaultValues;
  hideMethodsIdl?: boolean;
};
export type DefaultValues = {
  method: string;
  args: any;
};
