export function matchBadRequestExceptionArray(arr: (string | RegExp)[]) {
    return expect.objectContaining({
        response: expect.objectContaining({
            message: expect.arrayContaining(
                arr.map((str) => {
                    return expect.stringMatching(str);
                }),
            ),
        }),
    });
}
