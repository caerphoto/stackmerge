define([
    'backbone'
], function (
    Backbone
) {
    var ImageModel = Backbone.Model.extend({
        defaults: {
            name: 'unnamed image',
            id: '',
            visible: true,
            image: null,
            imageData: null,
            offset: { x: 0, y: 0 }
        },
        initialize: function (attributes) {
            this.on('change:image', this.generateImageData);
            this.readFileData(attributes.file);
        },
        readFileData: function (file) {
            var reader;
            if (!file) {
                this.set('image', null);
                return;
            }

            reader = new FileReader();
            reader.onload = function (evt) {
                var image = document.createElement('img');
                image.onload = function () {
                    this.set('image', image);
                }.bind(this);
                image.src = evt.target.result;
            }.bind(this);

            reader.readAsDataURL(file);
        },
        generateImageData: function () {
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            var image = this.get('image');

            canvas.width = image.width;
            canvas.height = image.height;
            ctx.drawImage(image, 0, 0);
            this.set('imageData', ctx.getImageData(0, 0, image.width, image.height));
        }
    });

    return ImageModel;
});
