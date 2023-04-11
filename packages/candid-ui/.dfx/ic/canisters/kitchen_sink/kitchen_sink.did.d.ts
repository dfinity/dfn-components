import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export type Result = { 'ok' : boolean } |
  { 'err' : string };
export interface complexArg {
  'array' : [] | [Array<string>],
  'bool' : [] | [boolean],
  'text' : [] | [string],
  'number' : [] | [bigint],
  'variant' : [] | [{ 'a' : string } | { 'b' : bigint }],
}
export interface _SERVICE {
  'bool' : ActorMethod<[boolean], boolean>,
  'int' : ActorMethod<[bigint], bigint>,
  'kitchenSink' : ActorMethod<[complexArg], Result>,
  'nat' : ActorMethod<[bigint], bigint>,
  'principal' : ActorMethod<[Principal], Principal>,
  'text' : ActorMethod<[string], string>,
  'whoami' : ActorMethod<[], Principal>,
}
