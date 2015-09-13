requirejs([
    'backbone',
    'models/m.preview',
    'collections/c.images',
    'views/v.images',
    'views/v.file',
    'views/v.preview'
], function (
    Backbone,
    PreviewModel,
    ImagesCollection,
    ImagesView,
    FileView,
    PreviewView
) {
    var preview = new PreviewModel();
    var images = new ImagesCollection(null, { previewModel: preview });

    new ImagesView({
        images: images,
        previewModel: preview
    });
    new FileView({
        images: images,
        previewModel: preview
    });
    new PreviewView({
        images: images,
        previewModel: preview
    });
});
