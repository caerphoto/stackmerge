define([
    'module',
    'backbone',
    'models/m.preview',
    'collections/c.images',
    'views/v.images',
    'views/v.file',
    'views/v.preview'
], function (
    module,
    Backbone,
    PreviewModel,
    ImagesCollection,
    ImagesView,
    FileView,
    PreviewView
) {
    var config = module.config();

    var preview = new PreviewModel();
    var images = new ImagesCollection(null, {
        workerPaths: config.workers,
        previewModel: preview
    });

    new ImagesView({
        images: images,
        previewModel: preview
    });
    new FileView({
        images: images,
        previewModel: preview,
        jpegWorkerPath: config.workers.jpeg_encoder
    });
    new PreviewView({
        images: images,
        previewModel: preview
    });
});
