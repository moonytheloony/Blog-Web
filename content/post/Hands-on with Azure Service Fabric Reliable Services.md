+++
author = "Rahul Rai"
categories = ["tools", "productivity"]
date = "2016-04-06T17:04:47+10:00"
draft = false
tags = ["ahk", "active directory"]
title = "Hands-on with Azure Service Fabric Reliable Services"
type = "post"
slug = "hands-on-with-azure-service-fabric-reliable-services"
+++

[Azure Service Fabric](https://azure.microsoft.com/en-in/documentation/services/service-fabric/), the next generation PaaS from Microsoft, is a platform to publish and manage microservices. The microservices methodology has been present for a long time in the industry. However, its adoption has been low due to non-availability of the right platform that hosts and manages the services and that does the heavy lifting of infrastructure challenges such as preserving state, rolling upgrades, inter-service communication and optimal use of machine resources etc..

Unlike current PaaS offerings for application deployment viz. [Cloud Service](https://azure.microsoft.com/en-in/documentation/articles/cloud-services-choose-me/) and [App Service](https://azure.microsoft.com/en-in/documentation/articles/app-service-web-overview/), Azure Service Fabric treats a collection of VMs as a worker pool on which applications can be deployed. Azure Service Fabric takes care of deploying your application to various nodes, failover, high availability etc. Azure Service Fabric offers two high-level frameworks for building services: the Reliable Services API and the Reliable Actors API. Today we will take a look at the Reliable Services API. Reliable Service API lets you write code in the traditional way while taking care of high availability and failover scenarios. It makes sure that any data you persist in a specialized set of collections ([`ReliableCollections`](https://azure.microsoft.com/en-in/documentation/articles/service-fabric-reliable-services-reliable-collections/)) remains available and consistent in case of failures. Reliable Services come in two flavors, stateless and stateful. As the names indicate, stateless services do not contain any state information and multiple instances of such a service can remain active at the same time to serve requests. Stateful services, on the other hand, can maintain state information and therefore only one instance (in a partition) remains active at any given point of time. A key feature, partitioning, is the concept of dividing the state (data) and compute into smaller accessible units to improve scalability and performance. Partitioning in the context of Service Fabric Stateful Services refers to the process of determining that a particular service partition is responsible for a portion of the complete state of the service.

## Objective

We will build a Service Fabric Reliable Service Application that will accept a search term as input, get tweets from Twitter for the search term and run sentiment analysis (through [Azure Text Analysis Service](https://azure.microsoft.com/en-in/documentation/articles/machine-learning-apps-text-analytics/)) on each tweet. The application will render the computed average sentiment for the search term through a web application (a Stateless Reliable Service Fabric Service) that interacts directly with the service (a Stateful Reliable Service Fabric Service).

## Approach

To explore as many services as we can, we will build a stateless web application named `TweetAnalytics.Web` that accepts a term as input and sends it to a Stateful Reliable Service named `TweetAnalytics.TweetService`. The service, in turn, will queue the message in a [`ReliableQueue`](https://msdn.microsoft.com/library/azure/dn971527.aspx) named `topicQueue`. An asynchronous process (`CreateTweetMessages`) in `TweetAnalytics.TweetService` will pick up the message and use [Twitter APIs](https://dev.twitter.com/overview/documentation) to get tweets for the search term. The tweets retrieved for the search term will be queued in another `ReliableQueue` named `tweetQueue`. Another asynchronous process (`ConsumeTweetMessages`) in the `TweetAnalytics.TweetService` application will pick each tweet from the `tweetQueue`, compute the tweet sentiment through Azure Text Analytics service and store the result in a [`ReliableDictionary`](https://msdn.microsoft.com/library/azure/dn971511.aspx) named `scoreDictionary`. The web application, `TweetAnalytics.Web`, can query the Reliable Service, `TweetAnalytics.TweetService`, to get the average score of sentiment for the given search term which will be computed from the data stored in the dictionary.

## Application Diagram

The following diagram of the application will help you visualize the solution that we will build.

{{< img src="/Service Fabric_4.png" alt="Service Fabric" >}}

## Code

The code for the application is available on my GitHub repository [here](https://github.com/moonytheloony/TweetAnalyticsServiceFabric).

## Building The Sample

As the first step, use [this link](https://azure.microsoft.com/en-in/documentation/articles/service-fabric-get-started/) to install Azure Service Fabric SDK, runtime, and tools. You would need to configure PowerShell to enable Service Fabric to execute scripts on your system for various tasks such as setup of the local cluster, deployment of your application on the cluster etc.. Before we get started with building the application itself, we would need access to Twitter APIs and Azure Text Analytics Service.

*   Use [this link](https://www.dougv.com/2015/08/posting-status-updates-to-twitter-via-linqtotwitter-walkthrough-tutorial-part-1/) to create a new Twitter Application and get necessary account secrets for accessing the Twitter REST APIs.
*   Use [this link](https://azure.microsoft.com/en-us/documentation/articles/cognitive-services-text-analytics-quick-start/) to get keys for the Azure Text Analytics Service. [Here](https://text-analytics-demo.azurewebsites.net/) is a console which you can use to play with the Text Analytics Service.

After the setup is complete, using your Visual Studio, create a new solution and add a new Service Fabric Application named `TweetAnalytics.TweetApp` to it.

{{< img src="/Create Service Fabric Application.png" alt="Create Service Fabric Application" >}}

Next, add a Stateless Reliable ASP.net 5 web application to your Service Fabric application by clicking on **Ok** and selecting the appropriate template on the following screen. Name the project `TweetAnalytics.Web`.

{{< img src="/Create ASPNET SF App.png" alt="Create ASPNET SF App" >}}

This application would act as the front end for your Stateful Reliable Service. To add the service to your application, right-click on `TweetAnalytics.TweetApp` project and select **Add > New Service Fabric Service**. This action will render a template dialog similar to the previous one. Select Stateful Reliable Service template from the dialog and name it `TweetAnalytics.TweetService`. Once these two projects are in place, we need to add one more project to the solution to enable communication between `TweetAnalytics.Web` and `TweetAnalytics.TweetService`. To enable this communication, add a class library named `TweetAnalytics.Contracts` to the solution and add an interface named `ITweet` that represents the contract of communication between the web application and the stateful service. Note that this interface should extend `IService` interface for the runtime to provide remoting infrastructure to the service contract.

~~~C#
namespace TweetAnalytics.Contracts
{
    using System.Threading.Tasks;
    using Microsoft.ServiceFabric.Services.Remoting;

    public interface ITweet : IService
    {
        Task<TweetScore>
    GetAverageSentimentScore();
    Task SetTweetSubject(string subject);
    }
}
~~~

    Add `TweetAnalytics.Contracts` as a dependency into `TweetAnalytics.Web` and `TweetAnalytics.TweetService` projects. Implement the interface `ITweet` in `TweetService` class. The following implementation of `SetTweetSubject` in `TweetService` class will clear contents of `scoreDictionary`, which is a `ReliableDictionary` (won't lose data in case of failures) that contains tweet message and sentiment score as a string and decimal pair, and add the search term  as a message to the `topicQueue` which is a `ReliableQueue`.

~~~C#
public async Task SetTweetSubject(string subject)
{
	if (this.cancellationToken.IsCancellationRequested)
	{
	return;
	}

	if (string.IsNullOrWhiteSpace(subject))
	{
	return;
	}

	using (var tx = this.StateManager.CreateTransaction())
	{
	var scoreDictionary =
	await this.StateManager.GetOrAddAsync<IReliableDictionary<string, decimal>>("scoreDictionary");
		await scoreDictionary.ClearAsync();
		var topicQueue = await this.StateManager.GetOrAddAsync<IReliableQueue<string>>("topicQueue");
		while (topicQueue.TryDequeueAsync(tx).Result.HasValue)
		{
		}
		await topicQueue.EnqueueAsync(tx, subject);
		await tx.CommitAsync();
	}
}
~~~

The implementation of `GetAverageSentimentScore` gets the average score from the `scoreDictionary`. Note that read operations happen on a [snapshot of the collection](https://azure.microsoft.com/en-in/documentation/articles/service-fabric-reliable-services-reliable-collections/#isolation-levels),therefore, it will ignore any updates that happen while you are iterating through the collection.

~~~C#
public async Task<TweetScore> GetAverageSentimentScore()
{
    if (this.cancellationToken.IsCancellationRequested)
    {
        return null;
    }

    var tweetScore = new TweetScore();
    var scoreDictionary =
        await this.StateManager.GetOrAddAsync<IReliableDictionary<string, decimal>>("scoreDictionary");
    using (var tx = this.StateManager.CreateTransaction())
    {
        tweetScore.TweetCount = await scoreDictionary.GetCountAsync(tx);
        tweetScore.TweetSentimentAverageScore = tweetScore.TweetCount == 0 ? 0 :
            scoreDictionary.CreateEnumerableAsync(tx).Result.Average(x => x.Value);
    }

    return tweetScore;
}
~~~

`TweetService` class overrides `RunAsync` method of `StatefulServiceBase` class which it inherits. In `RunAsync` method, you can write code to implement a processing loop which runs when the service is the primary replica. In `RunAsync` method we will spin up two methods:

*   `CreateTweetMessages`: This method, continuously gets tweets from Twitter REST API (consumed through [LinqToTwitter](https://linqtotwitter.codeplex.com/) package) by dequeuing a message from `topicQueue` and applying the message content as search term to the Twitter Search API. The tweets returned as a result are queued in `tweetQueue`.
*   `ConsumeTweetMessages`: This method, continuously gets messages from `tweetQueue` and uses the Azure Text Analysis Service to get the tweet sentiment score. The tweet along with the score is then stored in the `scoreDictionary`.

Following is the implementation for `CreateTweetMessages`.

~~~C#
private void CreateTweetMessages()
{
    while (!this.cancellationToken.IsCancellationRequested)
    {
        var topicQueue = this.StateManager.GetOrAddAsync<IReliableQueue<string>>("topicQueue").Result;
        using (var tx = this.StateManager.CreateTransaction())
        {
            var topic = topicQueue.TryDequeueAsync(tx).Result;
            if (topic.HasValue)
            {
                var tweets = this.GetTweetsForSubject(topic.Value);
                var tweetQueue = this.StateManager.GetOrAddAsync<IReliableQueue<string>>("tweetQueue").Result;
                foreach (var tweet in tweets)
                {
                    tweetQueue.EnqueueAsync(tx, tweet).Wait();
                }
            }

            tx.CommitAsync().Wait();
        }

        Thread.Sleep(TimeSpan.FromSeconds(10));
    }
}
~~~

Following is the code listing for `ConsumeTweetMessages`.

~~~C#
private void ConsumeTweetMessages()
{
    var tweetQueue = this.StateManager.GetOrAddAsync<IReliableQueue<string>>("tweetQueue").Result;
    var scoreDictionary =
        this.StateManager.GetOrAddAsync<IReliableDictionary<string, decimal>>("scoreDictionary").Result;
    while (!this.cancellationToken.IsCancellationRequested)
    {
        using (var tx = this.StateManager.CreateTransaction())
        {
            var message = tweetQueue.TryDequeueAsync(tx).Result;
            if (message.HasValue)
            {
                var score = this.GetTweetSentiment(message.Value);
                scoreDictionary.AddOrUpdateAsync(tx, message.Value, score, (key, value) => score);
            }

            tx.CommitAsync();
        }
    }
}
~~~

The `RunAsync` method spawns the above two methods.

~~~C#
protected override async Task RunAsync(CancellationToken token)
{
    this.cancellationToken = token;
    Task.Factory.StartNew(this.CreateTweetMessages, this.cancellationToken);
    Task.Factory.StartNew(this.ConsumeTweetMessages, this.cancellationToken);
    this.cancellationToken.WaitHandle.WaitOne();
}
~~~

That's all the work we need to do in the `TweetAnalytics.TweetService`. Next, in the `TweetAnalytics.Web` application we will add two simple actions that can interact with our Reliable Service to set the search term and get the average sentiment score. Now is a good time to talk about partitioning strategies for the `TweetAnalytics.TweetService` application and the `TweetAnalytics.Web` application.

## Note on Partitions

A great blog post discussing the available partitioning schemes is available [here](https://blogs.msdn.microsoft.com/mvpawardprogram/2015/10/13/understanding-service-fabric-partitions/). In our application, the web application need not use any partitions as it is stateless in nature, and therefore it uses the Singleton partition scheme which means that there would be no routing of incoming requests. The TweetService application, on the other hand, uses ranged partition (or UniformInt64Partition) with partition value 1, which is the default partition scheme that gets applied when you add a new stateful service project to your solution. This means that there will be a single partition, and therefore a single primary, catering to the requests. However, since this is a simple application, we won't use partitions here. However, considering the first alphabet of the search term as a partition identifier would have been a good design decision.

## Building The Web Application

We will use the transport provided by the runtime to make the remote call through the proxy provided by the framework. The proxy abstracts the underlying mechanism for remoting and endpoint discovery and enables communication between the services. The `ServiceProxy` requires the interface that is to be remoted, which in our case is the `ITweet` interface, the URI of the service to make the call to and the partition id of the receiver, which could be any static number since we are using a single partition. We can use a helper method to get the URI of the `TweetService` as shown below.

~~~C#
private Uri tweetServiceInstance = new Uri(FabricRuntime.GetActivationContext().ApplicationName + "/TweetService");
~~~

The controller methods are simple. Let's take a look at the `SetSubject` action which sends the search term to the `TweetService`.

~~~C#
public IActionResult SetSubject(string subject)
{
    var tweetContract = ServiceProxy.Create<ITweet>(this.defaultPartitionID, this.tweetServiceInstance);
    tweetContract.SetTweetSubject(subject).Wait();
    ViewBag.SearchTerm = subject;
    return View();
}
~~~

## Storing Configuration Data

You must have noticed that I have retrieved any secrets that I have used from a configuration store. Note that any application configuration data should be stored as parameters in **PackageRoot/Config/Settings.xml**. You can define your own sections in the file, store configurable values within it and retrieve those values through the Service Fabric runtime APIs. You can even override these values for different environments. Read more about transforms [here](https://azure.microsoft.com/en-us/documentation/articles/service-fabric-manage-multiple-environment-app-configuration).

{{< img src="/Settings File.png" alt="Settings File" >}}

## Deploy and Debug

Press F5 to deploy the solution to your local cluster. This action will spin up your application as well as the Service Fabric Cluster Manager that you can use to monitor your application. Click on the Local Cluster Manager icon in your taskbar to spawn the Local Cluster Manager UI.

{{< img src="/Service Fabric Local Cluster Manager.png" alt="Service Fabric Local Cluster Manager" >}}

This is a snapshot of my local cluster.

{{< img src="/Local Cluster Snapshot.png" alt="Local Cluster Snapshot" >}}

As you can see that the dashboard lists the applications that it is hosting and also the nodes that are hosting the applications. You can see that the web application has been deployed on Node 1 and the service has been deployed on Node 2, 3 and 4\. If you expand the nodes, you will find that one of the nodes is hosting the primary replica for `TweetService` which in my case is Node 4\.

{{< img src="/Node 4 is Hosting The Primary Replica.png" alt="Node 4 is Hosting The Primary Replica" >}}

To test the application, I will invoke the `TweetAnalytics.Web` application controller with an input (my name).

{{< img src="/Debugging Service Fabric Application.png" alt="Debugging Service Fabric Application" >}}

Once the message is queued, I can click on the link and keep refreshing the page to see the updated score.

{{< img src="/Debugging Service Fabric Application 2.png" alt="Debugging Service Fabric Application 2" >}}

Seems like there are negative sentiments associated with my name!! I can live with that. :-)

## Deploying to Azure

You can use [Service Fabric Party Clusters](http://tryazureservicefabric.eastus.cloudapp.azure.com/) to test your sample and see it in action on Azure. To deploy this sample to Azure, you would only need to change the port of your web application in the configuration located at **TweetAnalytics.Web > PackageRoot > ServiceManifest.xml** to a value that is assigned to you in the cluster invite.

With this application, I have barely scratched the surface of Service Fabric. There are tons of great features such as monitoring, upgrades and event tracing which I haven't covered. Other important tenets of Service Fabric you should explore are [Reliable Actors Applications](https://azure.microsoft.com/en-in/documentation/articles/service-fabric-reliable-actors-introduction/) and [Guest Executable Applications](https://azure.microsoft.com/en-in/documentation/articles/service-fabric-deploy-existing-app/). We have already covered Microsoft Orleans framework in an [earlier post](http://rahulrai.in/post/building-iot-solutions-with-microsoft-orleans-and-microsoft-azure---part-1) which is very similar to Service Fabric Reliable Actors Applications. I encourage you to read that.

I hope you found the post informative and interesting. Please do share the post and send in your suggestions. Thank you!

{{< subscribe >}}
