import {filterFiles} from "./filter-files";

export default (
    rawIncludedPaths: string | undefined,
    rawChangedTfDirectories: string | undefined,
    rawTfDirectories: string | undefined,
) =>
    filterFiles(
        rawIncludedPaths ?? "",
        rawChangedTfDirectories ?? "",
        rawTfDirectories ?? "",
    )
