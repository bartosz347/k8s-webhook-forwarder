export const truthyFilter = <T> (x: T | false | undefined | null | '' | 0): x is T => !!x
