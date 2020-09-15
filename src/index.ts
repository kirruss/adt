import type { ADTMember } from "ts-adt"

import { EndoTask, pack, Task } from "@kirrus/core"

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
