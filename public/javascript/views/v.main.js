define([
    'backbone',
    'underscore',
    'views/v.images',
    'views/v.upload'
], function (
    Backbone,
    _,
    ImagesView,
    UploadView
) {
    var MainView = Backbone.View.extend({
        el: 'body',
        initialize: function () {
            this.imagesView = new ImagesView();
            this.uploadsView = new UploadView({
                onUpload: _.bind(this.uploadedHandler, this)
            });
        },
        uploadedHandler: function (imagesData) {
            console.log(this);
            this.imagesView.images.add(imagesData);
            this.imagesView.render();
        }
    });

    return MainView;
});
