import { EndoTask, filter, pack, Task } from "@kirrus/core"

type ADTBase<T = string> = { _type: T }
type ObjectKey = number | string | symbol

/**
 * A helper type for extracting the members of an ADT
 */
export type ADTMember<
    ADT,
    Type extends ObjectKey
> = Extract<ADT, { _type: Type }>

/**
 * A helper that takes an object whose keys will be matched
 * against the type of the input as a task. Not all types in T
 * must exist as keys.
 *
 * @example
 * const task = match({
 *     foo: async a => always("foo"),
 *     bar: async a => always("bar")
 * })
 *
 * const alwaysFoo = await task({ _type: "foo" })
 * const alwaysBar = await task({ _type: "bar" })
 *
 * await alwaysFoo("foobar") // => "foo"
 * await alwaysBar("foobar") // => "bar"
 *
 * @param matchObject An object whose keys are of the same
 * type as the `_type` field of the input
 * @returns A task that matches an input against a set of inputs
 */
export const match = <A extends ADTBase, B>(
    matchObject: {
        [K in A["_type"]]?: Task<ADTMember<A, K>, B>
    }
): Task<A, B> => {
    return pack(async input => {
        const value = ((matchObject as any)[
            input._type
        ] as unknown) as Task<A, B> | null

        if (!value) return null

        return (value as unknown) as Task<A, B>
    })
}

/**
 * A helper that composes the pack combinator with the
 * match helper.
 *
 * @example
 * const task = packMatched({
 *     foo: async a =>
 *         always({ _type: "foo", message: "foobar" }),
 *     bar: async a =>
 *         always({ _type: "bar", message: "barbaz" })
 * })
 *
 * await task({ _type: "foo" }) // => { _type: 'foo', message: 'foobar' }
 * await task({ _type: "bar" }) // => { _type: 'bar', message: 'barbaz' }
 *
 * @param matchObject An object whose keys are of the same
 * type as the `_type` field of the input
 * @returns A task that matches an input against a set of inputs
 */
export const packMatched = <A extends ADTBase>(
    matchObject: {
        [K in A["_type"]]?: Task<
            ADTMember<A, K>,
            EndoTask<A>
        >
    }
): EndoTask<A> => pack(match(matchObject))

/**
 * A helper that generates matchers for a set of keys.
 *
 * @example
 * const { foo, bar } = generateMatchers(["foo", "bar"])()
 *
 * const task = pack(
 *     choose(
 *         compose(foo, async a => always("foo")),
 *         compose(bar, async a => always("bar"))
 *     )
 * )
 *
 * await task({ _type: "foo" }) // => "foo"
 * await task({ _type: "bar" }) // => "bar"
 * await task({ _type: "foobar" }) // => null
 *
 * @param keys A list of keys to generate matchers for
 * @returns An object made up of the passed keys and their
 * generated helpers
 */
export const generateMatchers = <T extends ObjectKey>(
    keys: T[]
) => <A extends ADTBase<T>>() =>
    (Object.fromEntries(
        keys.map(<K extends T>(key: K) => [
            key,
            filter((argument: A) => argument._type === key)
        ])
    ) as unknown) as {
        [K in T]: Task<A, ADTMember<A, K>>
    }
