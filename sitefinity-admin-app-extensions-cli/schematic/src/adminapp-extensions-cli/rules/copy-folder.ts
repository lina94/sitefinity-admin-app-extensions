import { Tree, Rule } from "@angular-devkit/schematics";
import { readdirSync, statSync } from "fs";
import { join } from "path";

export function copyFolderRecursively(path: string, destinationDir: string, folderFilterCb?: (folderName: string) => boolean, filesFilterCb?: (fileName: string) => boolean): Rule {
    return (tree: Tree): Tree => {
        function copyContent(folderPath: string, dest: string) {
            const combinePath = (fileOrFolderName: string) => join(folderPath, fileOrFolderName);
            const folderContent = readdirSync(folderPath);
            const dirNames: string[] = [];
            const fileNames: string[] = [];

            folderContent.forEach(contentName => {
                const stat = statSync(combinePath(contentName));
                if (stat.isFile()) {
                    if (filesFilterCb && !filesFilterCb(contentName)) {
                        return;
                    }

                    fileNames.push(contentName);
                } else  {
                    if (folderFilterCb && !folderFilterCb(join(folderPath, contentName))) {
                        return;
                    }

                    dirNames.push(contentName);
                }
            });

            dirNames.forEach(dirName => copyContent(combinePath(dirName), join(dest, dirName)));
            fileNames.forEach(fileName => {
                const content = tree.read(combinePath(fileName)) as Buffer;
                const newFilePath =  join(dest, fileName);

                if (!tree.exists(newFilePath)) {
                    tree.create(newFilePath, content);
                } else {
                    tree.overwrite(newFilePath, content);
                }
            });
        }

        copyContent(path, destinationDir);
        return tree;
    };
}