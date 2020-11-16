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

### Tip 3: Don't forget the proxy

Be aware that Spring uses a proxy class when instantiating beans. 
This means that if you annotated certain methods (eg. `@Cacheable`, `@Transactional`, `@PreAuthorize`, ...), these will **only** be applied when you call that method from the proxy.

If you call the method from within another method, these annotations won't work.

```java
public Order getOrder(long orderId) {
    return getOrder(orderId, LocalDate.now());
}

@Cacheable
public Order getOrder(long orderId, LocalDate date) {
  
}
```

In this example, the order **won't** be cached when you call the `getOrder(1L)` method. 
The solution to this problem depends on the use case, but often it can be solved by applying the same annotation to the other method as well.
