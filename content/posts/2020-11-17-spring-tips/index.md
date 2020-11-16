---
title: "25+ Spring tips"
date: "2020-11-17"
featuredImage: "../../images/logos/spring.png"
categories: ["Java", "Tutorials"]
tags: ["Spring boot", "Spring", "Spring Data", "Spring MVC"]
excerpt: "In this tutorial, I'll cover 25+ tips to follow when developing Spring applications."
---

Over the past few years I developed a few Spring applications and learned a few things. 
Now, before I share the tips, here's a small disclaimer. 
These tips are my based on my own opinion, you may or may not disagree with them. 
Do you have to apply these tips? No, you don't. 
If you have something that works, you don't have to change it.

## Core tips

### Tip 1: Prefer constructor injection over field injection

Back in the day, we usually injected fields like this:

```java
@Autowired
private OrderService orderService;
@Autowired
private CoffeeService coffeeService;
```

However, did you know you could replace this by a constructor:

```java
@Autowired
public CoffeeApplication(OrderService orderService, CoffeeService coffeeService) {
    this.orderService = orderService;
    this.coffeeService = coffeeService;
}
```

If you only have one constructor, you can even remove the @Autowired` annotation and have a plain, simple constructor.

**Why?** First of all, it allows you to use final fields, and thus, make your class immutable. `
Another advantage is that it's easier to detect missing mocks in unit tests. 
If you're trying to inject mocks into a field-injected service, you'll have to rely on reflection. 
With constructors on the other hand, you can use a simple setup method:

```java
@BeforeEach
void init() {
    orderService = mock(OrderService.class);
    coffeeService = mock(CoffeeService.class);
    application = new CoffeeApplication(orderService, coffeeService);
}
```

### Tip 2: Use configuration properties over values

If you want to use an application property or environment variable within your application, you could use the `@Value` annotation:

```java
@Value("${db.host}")
private String databaseHost;
```

However, you can also use configuration properties:

```java
@ConfigurationProperties(prefix = "host")
public class DatabaseProperties {
  private String databaseHost;
}
```

**Why?** This approach allows you to group properties together, but it also uses a better way of binding. 
For example, if you have a duration-based properties, you could do this:

```java
@DurationUnit(ChronoUnit.SECONDS)
private Duration timeout;
```

