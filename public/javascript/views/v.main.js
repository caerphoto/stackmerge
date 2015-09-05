define([
    'backbone',
    'underscore',
    'collections/c.images',
    'views/v.images',
    'views/v.upload'
], function (
    Backbone,
    _,
    ImagesCollection,
    ImagesView,
    UploadView
) {
    var MainView = Backbone.View.extend({
        el: 'body',
        initialize: function () {
            this.images = new ImagesCollection();
            this.imagesView = new ImagesView({
                images: this.images
            });
            this.uploadsView = new UploadView({
                images: this.images
            });
        }
    });

    return MainView;
});
