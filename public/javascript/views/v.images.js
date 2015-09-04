define([
    'backbone',
    'mustache',
    'collections/c.images'
], function (
    Backbone,
    Mustache,
    ImagesCollection
) {
    var ImagesView = Backbone.View.extend({
        el: 'ol.image-stack',
        template: document.getElementById('template-stack-item').innerHTML,
        initialize: function () {
            this.images = new ImagesCollection();
        },
        render: function () {
            this.el.innerHTML = Mustache.render(
                this.template,
                { images: this.images.toJSON() }
            );
        }
    });

    return ImagesView;
});
