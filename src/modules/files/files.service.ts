import { Injectable } from '@nestjs/common';

@Injectable()
export class FilesService {
    getFileBaseEndpointUrl(ctx: any) {
        return `http${ctx.req.secure ? 's' : ''}://${
            ctx.req.headers.host
        }/files`;
    }
}
