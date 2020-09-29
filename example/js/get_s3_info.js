export async function getChildDirectoryArray(s3, prefix, bucket) {
    let childDirectoryArray = [];
    const response = await s3.makeUnauthenticatedRequest('listObjectsV2', { Bucket: bucket, Prefix: prefix, Delimiter: "/" }).promise();
    //console.log(prefix)
    //console.log(response)
    response.CommonPrefixes.forEach(commonPrefix => {
        childDirectoryArray.push(commonPrefix.Prefix.replace(prefix, "").replace("/", ""));
    });
    return childDirectoryArray;
}
