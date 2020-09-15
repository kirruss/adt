import type { ADTMember } from "ts-adt"

import { EndoTask, filter, pack, Task } from "@kirrus/core"

type ADTBase<T> = { _type: T }

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
