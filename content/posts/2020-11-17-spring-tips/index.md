---
title: "25+ Spring tips"
date: "2020-11-17"
featuredImage: "../../images/logos/spring-boot.png"
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

### Tip 4: You may not need an interface

When we create a service with Spring, I often see people creating an interface (eg. `OrderService`), and an implementation (eg. `OrderServiceImpl`). 
This is not required by the Spring framework. You could write your code like this:

```java
@Service
public class OrderService { // No implements
}
```

Some may argue that using interfaces is a good way to apply **Inversion of Control**. 
Yes, I agree with them. However, you have to ask yourself whether it's useful in your case to invert the control between the web and service layer in your application.
I would rather apply inversion of control to services that should be triggered from another domain. 

For example, let's say you have a `CustomerService`, and when the customer deletes their account, you want all orders to be deleted as well. You could do something like this:

```java
@Service
public class CustomerService {
    private final OrderService orderService; // Autowired
    
    public void delete(long customerId) {
        // TODO: Delete customer
        orderService.deleteAllByCustomerId(customerId);
    }
}
```
However, now you tied two domains (orders and customers) together.
This is where inversion of control is useful to me. 
Rather than coupling these domains, you can create a new interface within the customer-domain: 

```java
public interface CustomerDeletedListener {
    void onDelete(long customerId);
}
```

You can implement these within the order-domain:

```java
public class OrderCustomerDeletionListener implements CustomerDeletedListener {
   public void onDelete(long customerId) {
       orderService.deleteAllByCustomerId(customerId);
   }
}
```

And then you can autowire them in your `CustomerService`:

```java
@Service
public CustomerService {
    private List<CustomerDeletedListener> deletionListeners;
  
    public void delete(long customerId) {
        // TODO: Delete customer
        deletionListeners.forEach(listener -> listener.onDelete(customerId));
    }
}
```

And there you have it, now the customer and order domains are loosely coupled again.


