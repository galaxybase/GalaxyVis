import {
    CsvExportOptions,
    ImageExportOptions,
    JsonExportOptions,
    SvgExportOptions,
    XlsxExportOptions,
} from '../types'
import {
    exportImageHandler,
    exportJsonHandler,
    exportExcelHandler,
    exportCsvHandler,
    exportSVGHandler,
} from '../utils/export'

/**
 * @class Export
 * @constructor
 * @param {galaxyvis<any>} 初始化
 */
export default class Export<T, K> {
    private galaxyvis: any
    constructor(galaxyvis: any) {
        this.galaxyvis = galaxyvis
    }
    // 导出png
    public png(options?: ImageExportOptions) {
        return exportImageHandler('png', this.galaxyvis, options)
    }

    // 导出jpg
    public jpg(options?: ImageExportOptions) {
        return exportImageHandler('jpg', this.galaxyvis, options)
    }

    // 导出svg
    public svg(options?: SvgExportOptions) {
        return exportSVGHandler('svg', this.galaxyvis, options)
    }

    // 导出json
    public json(options?: JsonExportOptions) {
        return exportJsonHandler(this.galaxyvis, options)
    }

    // 导出xlsx
    public xlsx(options?: XlsxExportOptions) {
        return exportExcelHandler(this.galaxyvis, options)
    }

    // 导出csv
    public csv(options?: CsvExportOptions) {
        return exportCsvHandler(this.galaxyvis, options)
    }
}
