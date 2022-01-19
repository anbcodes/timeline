# Timeline

A simple timeline app

Sample docker command:

```sh
sudo docker build . -t timeline && sudo docker run --rm -it -e TIMELINE_USERNAME=[username] -e TIMELINE_PASSWORD=[password] -v data:/data -p 8080:8080 timeline
```
