/**
 * 文字换行
 * @param text
 * @param maxLineLength
 * @returns
 */
export function getLines(text: string, maxLineLength: number) {
    var words = (text + '').split('\\n'),
        lines = [],
        lineLength = 0,
        lineIndex = 0,
        lineList = [],
        lineFull = true
    for (var i = 0; i < words.length; ++i) {
        if (lineFull) {
            if (words[i].length > maxLineLength) {
                var parts = splitWord(words[i], maxLineLength)
                for (var j = 0; j < parts.length; ++j) {
                    lines.push([parts[j]])
                    lineIndex++
                }
                lineLength = parts[parts.length - 1].length
            } else {
                lines.push([words[i]])
                lineIndex++
                lineLength = words[i].length
            }
            lineFull = false
        } else if (lineLength + words[i].length <= maxLineLength) {
            !lines[lineIndex] && (lines[lineIndex] = [])
            lines[lineIndex++].push(words[i])
            lineLength += words[i].length + 1
        } else {
            lineFull = true
            --i
        }
    }


    for (i = 0; i < lines.length; ++i) {
        lineList.push(lines[i].join(' '))
    }

    return lineList
}
/**
 * 分割文字
 * @param word
 * @param maxLength
 * @returns
 */
function splitWord(word: string, maxLength: number) {
    var parts = []
    for (var i = 0; i < word.length; i += maxLength) {
        parts.push(word.substr(i, maxLength))
    }
    return parts
}
