define([
    'backbone',
    'underscore',
    'models/m.image'
], function (
    Backbone,
    _,
    ImageModel
) {
    var ImagesCollection = Backbone.Collection.extend({
        model: ImageModel,
        addFromFiles: function (files) {

            _.each(files, function (file) {
                var id = _.uniqueId('stackmerge_');
                var reader = new FileReader();

                this.push({
                    name: file.name,
                    id: id,
                    data: null
                });

                reader.onload = (function (aId, collection) {
                    return function (evt) {
                        var model = collection.findWhere({ id: aId });
                        model.set('data', evt.target.result);
                    };
                }(id, this));
                reader.readAsDataURL(file);

            }, this);
        }
    });

    return ImagesCollection;
});
