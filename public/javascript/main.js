requirejs([
    'backbone',
    'collections/c.images',
    'views/v.images',
    'views/v.file',
    'views/v.preview'
], function (
    Backbone,
    ImagesCollection,
    ImagesView,
    FileView,
    PreviewView
) {
    var images = new ImagesCollection();
    new ImagesView({
        images: images
    });
    new FileView({
        images: images
    });
    new PreviewView({
        images: images
    });
});
