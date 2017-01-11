/**
 *
 * Copyright 2014-present Basho Technologies, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var assert = require('assert');

var Test = require('../testparams');
var FetchServerInfo = require('../../../lib/commands/fetchserverinfo');
var FetchPreflist = require('../../../lib/commands/kv/fetchpreflist');

var cb = function (err, resp) {
    assert(!err, err);
    assert.equal(resp.preflist.length, 3); // NB: since nval is 3
};

describe('FetchPreflist - Integration', function() {
    var cluster;
    before(function(done) {
        var self = this;
        cluster = Test.buildCluster(function (err, rslt) {
            assert(!err, err);
            
            function info_cb(err, resp) {
                if (resp.server_version < '2.1') {
                    self.skip();
                }
                done();
            }

            var fetch = new FetchServerInfo(info_cb);
            cluster.execute(fetch);
        });
    });

    after(function(done) {
        cluster.stop(function (err, rslt) {
            assert(!err, err);
            done();
        });
   });

    it('fetch-default-type-preflist', function(done) {
        var fetch = new FetchPreflist.Builder()
                .withBucket(Test.bucketName)
                .withKey('my_key1')
                .withCallback(function (err, resp) { cb(err, resp); done(); })
                .build();
        cluster.execute(fetch);
    });
    
    it('fetch-non-default-type-preflist', function(done) {
        var fetch = new FetchPreflist.Builder()
                .withBucket(Test.bucketName)
                .withBucketType(Test.bucketType)
                .withKey('my_key1')
                .withCallback(function (err, resp) { cb(err, resp); done(); })
                .build();
        cluster.execute(fetch);
    });
});
