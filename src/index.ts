import type { ADTMember } from "ts-adt"

import { EndoTask, filter, pack, Task } from "@kirrus/core"

type ADTBase<T> = { _type: T }

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
export const match = <
    T extends string,
    A extends ADTBase<T>,
    B
>(
    matchObject: { [K in T]?: Task<ADTMember<A, K>, B> }
): Task<A, B> => {
    return pack(
        async (input): Promise<Task<A, B> | null> => {
            const value = matchObject[input._type]

            if (!value) return null

            return (value as unknown) as Task<A, B>
        }
    )
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
export const packMatched = <
    T extends string,
    A extends ADTBase<T>
>(
    matchObject: {
        [K in T]?: Task<ADTMember<A, K>, EndoTask<A>>
    }
): EndoTask<A> => pack(match(matchObject))

export const generateMatchers = <T extends string>(
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
