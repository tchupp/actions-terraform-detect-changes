import filterFiles from "./index";

describe("filterFiles", () => {

    describe("no include or exclude", () => {

        it("all empty", () => {
            const result = filterFiles(
                "      ",
                "          ",
                "    "
            );

            expect(result)
                .toStrictEqual({
                    changed: []
                });
        })

        it("all changes exist", () => {
            const result = filterFiles(
                "",
                "dev staging production modules/humans modules/teams/engineers modules/teams/leads",
                "dev staging production modules/humans modules/teams/engineers modules/teams/leads"
            );

            expect(result)
                .toStrictEqual({
                    changed: [
                        "dev",
                        "staging",
                        "production",
                        "modules/humans",
                        "modules/teams/engineers",
                        "modules/teams/leads",
                    ]
                });
        })

        it("removes directories that don't exist", () => {
            const result = filterFiles(
                "",
                "dev staging production modules/humans modules/teams/engineers modules/teams/leads",
                "dev staging production modules/humans modules/teams/engineers"
            );

            expect(result)
                .toStrictEqual({
                    changed: [
                        "dev",
                        "staging",
                        "production",
                        "modules/humans",
                        "modules/teams/engineers",
                    ]
                });
        })

        it("only includes directories that changed", () => {
            const result = filterFiles(
                "",
                "modules/humans modules/teams/engineers",
                "dev staging production modules/humans modules/teams/engineers modules/teams/leads"
            );

            expect(result)
                .toStrictEqual({
                    changed: [
                        "modules/humans",
                        "modules/teams/engineers",
                    ]
                });
        })

        it("removes absolute paths", () => {
            const result = filterFiles(
                "",
                "/tf dev staging production modules/humans modules/teams/engineers modules/teams/leads",
                "/tf dev staging production modules/humans modules/teams/engineers modules/teams/leads"
            );

            expect(result)
                .toStrictEqual({
                    changed: [
                        "dev",
                        "staging",
                        "production",
                        "modules/humans",
                        "modules/teams/engineers",
                        "modules/teams/leads",
                    ]
                });
        })
    })

    const tfDirectories = ". dev staging production modules/humans modules/teams/engineers modules/teams/leads";

    describe("includes", () => {
        it("matches multiple directories exactly", () => {
            const result = filterFiles(
                ". dev",
                tfDirectories,
                tfDirectories
            );

            expect(result)
                .toStrictEqual({
                    changed: [
                        ".",
                        "dev",
                    ]
                });
        })

        it("matches single glob", () => {
            const result = filterFiles(
                "./*",
                tfDirectories,
                tfDirectories
            );

            expect(result)
                .toStrictEqual({
                    changed: [
                        "dev",
                        "staging",
                        "production",
                    ]
                });
        })

        it("matches single glob in a subdirectory", () => {
            const result = filterFiles(
                "modules/*",
                tfDirectories,
                tfDirectories
            );

            expect(result)
                .toStrictEqual({
                    changed: [
                        "modules/humans",
                    ]
                });
        })

        it("matches double glob", () => {
            const result = filterFiles(
                "./**",
                tfDirectories,
                tfDirectories
            );

            expect(result)
                .toStrictEqual({
                    changed: [
                        "dev",
                        "staging",
                        "production",
                        "modules/humans",
                        "modules/teams/engineers",
                        "modules/teams/leads",
                    ]
                });
        })

        it("matches double glob in a subdirectory", () => {
            const result = filterFiles(
                "./modules/**",
                tfDirectories,
                tfDirectories
            );

            expect(result)
                .toStrictEqual({
                    changed: [
                        "modules/humans",
                        "modules/teams/engineers",
                        "modules/teams/leads",
                    ]
                });
        })

        it("matches double glob in a subdirectory with a negative", () => {
            const result = filterFiles(
                "./modules/** !./modules/humans",
                tfDirectories,
                tfDirectories
            );

            expect(result)
                .toStrictEqual({
                    changed: [
                        "modules/teams/engineers",
                        "modules/teams/leads",
                    ]
                });
        })
    })

    describe("excludes", () => {
        it("matches multiple directories exactly", () => {
            const result = filterFiles(
                "!dev, !staging",
                tfDirectories,
                tfDirectories
            );

            expect(result)
                .toStrictEqual({
                    changed: [
                        ".",
                        "production",
                        "modules/humans",
                        "modules/teams/engineers",
                        "modules/teams/leads",
                    ]
                });
        })

        it("matches single glob", () => {
            const result = filterFiles(
                "!./*",
                tfDirectories,
                tfDirectories
            );

            expect(result)
                .toStrictEqual({
                    changed: [
                        ".",
                        "modules/humans",
                        "modules/teams/engineers",
                        "modules/teams/leads",
                    ]
                });
        })

        it("matches single glob in a subdirectory", () => {
            const result = filterFiles(
                "!modules/*",
                tfDirectories,
                tfDirectories
            );

            expect(result)
                .toStrictEqual({
                    changed: [
                        ".",
                        "dev",
                        "staging",
                        "production",
                        "modules/teams/engineers",
                        "modules/teams/leads",
                    ]
                });
        })

        it("matches double glob", () => {
            const result = filterFiles(
                "!./**",
                tfDirectories,
                tfDirectories
            );

            expect(result)
                .toStrictEqual({
                    changed: [
                        ".",
                    ]
                });
        })

        it("matches double glob in a subdirectory", () => {
            const result = filterFiles(
                "!./modules/**",
                tfDirectories,
                tfDirectories
            );

            expect(result)
                .toStrictEqual({
                    changed: [
                        ".",
                        "dev",
                        "staging",
                        "production",
                    ]
                });
        })

        it("matches double glob in a subdirectory", () => {
            const result = filterFiles(
                "!./modules/**",
                tfDirectories,
                tfDirectories
            );

            expect(result)
                .toStrictEqual({
                    changed: [
                        ".",
                        "dev",
                        "staging",
                        "production",
                    ]
                });
        })
    })
})
