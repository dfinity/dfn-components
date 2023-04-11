export const idlFactory = ({ IDL }) => {
  const complexArg = IDL.Record({
    'array' : IDL.Opt(IDL.Vec(IDL.Text)),
    'bool' : IDL.Opt(IDL.Bool),
    'text' : IDL.Opt(IDL.Text),
    'number' : IDL.Opt(IDL.Int),
    'variant' : IDL.Opt(IDL.Variant({ 'a' : IDL.Text, 'b' : IDL.Int })),
  });
  const Result = IDL.Variant({ 'ok' : IDL.Bool, 'err' : IDL.Text });
  return IDL.Service({
    'bool' : IDL.Func([IDL.Bool], [IDL.Bool], ['query']),
    'int' : IDL.Func([IDL.Int], [IDL.Int], ['query']),
    'kitchenSink' : IDL.Func([complexArg], [Result], []),
    'nat' : IDL.Func([IDL.Nat], [IDL.Nat], ['query']),
    'principal' : IDL.Func([IDL.Principal], [IDL.Principal], ['query']),
    'text' : IDL.Func([IDL.Text], [IDL.Text], ['query']),
    'whoami' : IDL.Func([], [IDL.Principal], ['query']),
  });
};
export const init = ({ IDL }) => { return []; };
