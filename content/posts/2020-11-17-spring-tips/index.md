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

Since this will be a lengthy tutorial, here are some links to navigate:

- [Core tips](#core-tips)
    - [Tip 1: Prefer constructor injection over field injection](#tip-1-prefer-constructor-injection-over-field-injection)
    - [Tip 2: Use configuration properties over values](#tip-2-use-configuration-properties-over-values)
    - [Tip 3: Don't forget the proxy](#tip-3-dont-forget-the-proxy)
    - [Tip 4: You may not need an interface](#tip-4-you-may-not-need-an-interface)
    - [Tip 5: Use the bill of materials](#tip-5-use-the-bill-of-materials)
    - [Tip 6: Utilize externalized configuration](#tip-6-utilize-externalized-configuration)
    - [Tip 7: Declare beans in separate configuration classes](#tip-7-declare-beans-in-separate-configuration-classes)
- [Data access tips](#data-access-tips)
    - [Tip 8: Avoid linking all entities together](#tip-8-avoid-linking-all-entities-together)
    - [Tip 9: You may not need JPA](#tip-9-you-may-not-need-jpa)
    - [Tip 10: You don't have to return entities within repositories](#tip-10-you-dont-have-to-return-entities-within-repositories)
    - [Tip 11: Think about integration testing](#tip-11-think-about-integration-testing)
    - [Tip 12: Use a database migration tool](#tip-12-use-a-database-migration-tool)
    - [Tip 13: Be aware of the Open Session in View (OSIV) setting](#tip-13-be-aware-of-the-open-session-in-view-osiv-setting)
- [Web/API tips](#webapi-tips)
    - [Tip 14: Think outside CRUD](#tip-14-think-outside-crud)
    - [Tip 15: Use shorthand annotations where possible](#tip-15-use-shorthand-annotations-where-possible)
    - [Tip 16: Always include Spring boot actuator](#tip-16-always-include-spring-boot-actuator)
    - [Tip 17: Alwaays use the same type of error handling](#tip-17-always-use-the-same-type-of-error-handling)
    - [Tip 18: Use the correct HTTP method](#tip-18-use-the-correct-http-method)
    - [Tip 19: Avoid verbs in endpoints](#tip-19-avoid-verbs-in-endpoints)
    - [Tip 20: Avoid using entities in your web layer](#tip-20-avoid-using-entities-in-your-web-layer)
    - [Tip 21: Use bean validations](#tip-21-use-bean-validations)
    - [Tip 22: Think about integration testing... again](#tip-22-think-about-integration-testing-again)
    - [Tip 23: Think security-first](#tip-23-think-security-first)
    - [Tip 24: Make pagination easier with Spring data support](#tip-24-make-pagination-easier-with-spring-data-support)
    - [Tip 25: Use RestTemplateBuilder](#tip-25-use-resttemplatebuilder)
- [Project structure tips](#project-structure-tips)
    - [Tip 26: Prefer structuring by domain](#tip-26-prefer-structuring-by-domain)
    - [Tip 27: Prefer domain classes over utilities](#tip-27-prefer-domain-classes-over-utilities)
    
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

**Why?** First of all, it allows you to use final fields, and thus, make your class immutable.
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

Then you can autowire them in your `CustomerService`:

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

### Tip 5: Use the bill of materials

When developing a Spring boot application, you'll end up adding a few dependencies with your build tool (Maven or Gradle). 
When doing so, try to avoid manually declaring the version:

```xml
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-web</artifactId>
  	<version>5.2.9.RELEASE</version> <!-- Avoid manually declaring the version -->
</dependency>
```

In stead, use `spring-boot-starter-parent`:

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>2.3.4.RELEASE</version> <!-- Only declare the Spring boot version here -->
</parent>
```

**Why?** This allows you to use most Spring libraries without having to declare their versions by yourself, as you'll be relying on the managed versions which should work together:

```xml
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-web</artifactId>
    <!-- Now you no longer need to add the version -->
</dependency>
```

If you're within a multi-module project, and you can't use `spring-boot-starter-parent`, then you can use `spring-boot-dependencies`:

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-dependencies</artifactId>
            <version>2.3.4.RELEASE</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

Even if you want to use a newer version of certain Spring library, you can often configure which releasetrain you want to use:

```xml
<properties>
    <spring-data-releasetrain.version>Neumann-SR4</spring-data-releasetrain.version>
</properties>
```

### Tip 6: Utilize externalized configuration

When developing Spring boot applications, you can use application properties (eg. `application.properties`) and even profile-specific application properties (eg. `application-prod.properties`). 
Avoid declaring environment-related properties within your classpath.

```properties
# src/main/resources/application-prod.properties
spring.datasource.url=jdbc://url-to-my-production-database
```

**Why?** These parameters can change, and are usually managed elsewhere.
By adding them to your classpath, each change means you have to rebuild your application.
To solve this, you can either use externalized configuration or environment variables:

```shell
SPRING_DATASOURCE_URL=jdbc://url-to-my-production-database
```

Read more about this at [The Twelve-Factor App](https://12factor.net/config).

### Tip 7: Declare beans in separate configuration classes

Spring allows you to declare beans (methods with the `@Bean` annotation) in both the main class and any other class using the `@Configuration` annotation. 
I recommend using separate configuration classes as often as possible. 
**Why?** By doing so, you can group related beans, which allows you to use conditionals on class-level to enable or disable the entire configuration.

In addition, beans declared within the main class are always picked up when writing an integration test, even if you don't need them. This means that your integration tests could be slower if you add those beans to your main class.

## Data access tips

### Tip 8: Avoid linking all entities together

When working with an ORM-framework, it's easy to link all your entities together. 
However, as your application grows, more and more domains will end up being linked together, and you'll end up with high coupling, as everything will be tied together.

In stead of doing so, try to identify the various domains within your application, and avoid linking entities together that are from a different domains together. 
If an update within one domain that has an impact on another, then you can use events to make this happen.

### Tip 9: You may not need JPA

JPA and its implementations such as Hibernate offer a fully-featured ORM framework that works really well. 
Be aware though that there are alternatives, such as using Spring's `JdbcTemplate`. 
In addition, there's also a Spring data library for JDBC that works just as nice as Spring Data JPA. 
You can still create entities, use repositories and so on. For example:

```java
public class Person {
  @Id
  private final Long id;                                                
  private final String name;
}

public interface PersonRepository extends CrudRepository<Person, Long> {
  List<Person> findAllByName(String name);
}
```

**Why?** These alternatives are usually a bit more lightweight.

### Tip 10: You don't have to return entities within repositories

Within a Spring data JPA repository, you usually work with entities. 
You persist them, retrieve them, delete them and so on. 
However, you can also return other types of data. 
For example, let's say we have a person entity with various fields such as the ID, name, birthdate, social security number and so on. 
For one feature, we just want to list all people with their name. 
You could retrieve the entire entity, or you could work with a projection:

```java
public interface PersonName {
  Long getId();
  String getName();
}

public interface PersonRepository extends CrudRepository<Person, Long> {
    List<PersonName> findAllNames();
}
```

**Why?** This approach allows you to work with more lightweight objects. 
Read more about them within [the documentation](https://docs.spring.io/spring-data/jpa/docs/current/reference/html/#projections).

### Tip 11: Think about integration testing

When we're adding methods and queries to our repositories, we should think about testing these. 
The most recommended way of doing so is by writing integration tests against the same type of database. 
If this is not possible, it's still recommended to write integration tests, and run them against a different database.

To do so, you could use an in memory database (like H2 or hsqldb), and write your tests with Spring:

```java
@ExtendWith(SpringExtension.class)
@DataJpaTest
class PersonRepositoryTest {
    @Autowired
    private PersonRepository repository;
  
    // TODO: Write tests
}
```

If you're using an in memory database, I recommend using SQL to generate the schema. 
To do this, you could use a **schema.sql** file located within your test classpath. 
The reason why I wouldn't use Hibernate's DDL generation is because if there's a wrong mapping within your entities, it will be more difficult to spot.

However, you can still use Hibernate to verify that your schema matches the entity mapping. 
To do so, add the following annotation to your test:

```java
@ExtendWith(SpringExtension.class)
@DataJpaTest
@TestPropertySource(properties = {
  "spring.jpa.hibernate.ddl-auto=validate"
})
class PersonRepositoryTest {
    @Autowired
    private PersonRepository repository;
  
    // TODO: Write tests
}
```

### Tip 12: Use a database migration tool

As your project grows, so does your schema. 
It can be very useful to maintain your schema with your code, so that they're part of your workflow and changes to the database are immediately visible when merging your code. 

To properly version these database changes, I recommend using a database migration tool like Flyway or Liquibase. These tools allow you to create new migrations or undo old ones.

Last year, I wrote [a tutorial about using Flyway with Spring boot](https://dimitr.im/loading-initial-data-with-spring).

### Tip 13: Be aware of the Open Session In View (OSIV) setting

If you're using Spring boot, by default, the Hibernate session will remain open within the view of your application. 
This makes it really easy to use entities within your JSON response, as the nested entities will be fetched automatically when the view is constructed.

However, it can lead to performance issues as mentioned within [The Open Session In View Anti-Pattern](https://vladmihalcea.com/the-open-session-in-view-anti-pattern/) by Vlad Mihalcea. 
More information about the pro's and contra's about this setting can be found within the [comment section of this pull request](https://github.com/spring-projects/spring-boot/pull/7125).

Since Spring boot 2, a warning will be logged when no explicit OSIV setting is configured. 
To explicitely configure this setting you can use the `spring.jpa.open-in-view` application property.

## Web/API tips

### Tip 14: Think outside CRUD

When creating a REST API, I often see API's being constructed as a simple CRUD. 
While this certainly allows you to do most things, being just a proxy to the database doesn't add much value. 
It could be more interesting to provide endpoints that contain additional business logic to actually create value.

### Tip 15: Use shorthand annotations where possible

They've been available for a while now, but did you know that  there are annotations like `@GetMapping`, which can be used in stead of `@RequestMapping(method = RequestMethod.GET)`? 
Here's a list of more shorthand annotations that are available for controllers:

- `@RestController` is an alternative to `@Controller` and `@ResponseBody`.
- `@GetMapping`, `@PostMapping`, `@PutMapping` and `@DeleteMapping` are alternatives to `@RequestMethod` with their specific request method.
- `@RestControllerAdvice` is an alternative to `@ControllerAdvice` and `@ResponseBody`

**Why?** The advantage is that they are a lot more readable, especially the alternatives to `@RequestMethod`.

### Tip 16: Always include Spring boot actuator

Spring boot comes with a nice library called Spring boot Actuator, which provides production-ready features, that will really help you in the long term. 
They allow you to do better logging, monitoring, performance tuning and so on. 
Summarized, they make more people happy. 
Recently, I wrote [a lengthy tutorial about it](https://dimitr.im/mastering-spring-boot-actuator), so read it for more information.

### Tip 17: Always use the same type of error handling

When it comes to error handling, Spring Web allows you to do it in a few ways. 
First of all, you could handle it by yourself:

```java
@GetMapping("/{id}")
public ResponseEntity<User> findById(@PathVariable long id) {
    return ResponseEntity.of(service.findById(id));
}
```

Alternatively, you could use an exception with a `@ResponseStatus`:

```java
@ResponseStatus(HttpStatus.NOT_FOUND)
public UserNotFoundException extends RuntimeException {}
```

This allows you to do the following:

```java
@GetMapping("/{id}")
public User findById(@PathVariable long id) {
    return service
        .findById(id)
        .orElseThrow(UserNotFoundException::new);
}
```

If you don't like putting the `@ResponseStatus` on your exception, you can use an `@ExceptionHandler`. 
This could be useful if your exception comes from your business logic and you don't want to pollute your business logic with web-related stuff. 
For example:

```java
@ResponseStatus(HttpStatus.NOT_FOUND)
@ExceptionHandler(UserNotFoundException.class)
public void handleUserNotFound(UserNotFoundException ex) {}
```

However, this makes it tied to the controller where you defined the exception handler. 
If you want to handle these exceptions the same way across your application, you can create a separate class for these handlers and annotate it with `@ControllerAdvice`.

As you've seen now, there are several ways to handle errors within your application. 
Is one better than the other? Not necessarily, it depends on the context. 
I do recommend handling your errors in the same way across your entire application though. 
This increases readability.

### Tip 18: Use the correct HTTP method

There are a few HTTP methods, such as GET, POST, PUT, DELETE and PATCH. 
Try to use the right HTTP method for the right operation, such as:

- **GET**: This method should be used for read operations.
- **POST**: This method can be used for creating resources. 
- **PUT**: This method can be used for updating resources.
- **PATCH**: This method can be used for partially updating resources.
- **DELETE**: This method can be used to delete resources.

There are a few debates going on though. 
Some people suggest that you can use PUT for both creating and updating resources. 
The problem with this is that GET, PUT and DELETE are considered idempotent. 
This means that you should be able to repeat these calls, and the end state should be the same. 
This is not true when you use `PUT` to create resources, because if you repeat it 5 times, you have 5 resources, 
if you repeat it 2 times, you only have 2 resources.

The other question is, should I use PATCH or PUT to update resources? 
PATCH is considered useful for doing partial updates, the reason is that PATCH isn't idempotent either. 
Let's say we have a resource called "employee", with the fields "id", "name", "startDate" and "title". 

If we update only the title value, we can't use PUT, because people can be updating the resource simultaneously. 
That means that we can't guarantee that the resources are the same if I repeat this request 5 times. 

### Tip 19: Avoid verbs in endpoints

If you're creating an API, remember that the API endpoint should contain the name of the resource, not a verb. 
The verb itself is contained within the HTTP method you use (see [tip 18](#tip-18-use-the-correct-http-method)). 
So use URLs like **/api/employee/1** and not **/api/getEmployee/1**.

### Tip 20: Avoid using entities in your web layer

Avoid using entities within your web layer, as things can become really messy. 
First of all, your entity structure represents a record within a database, is not necessarily the best representation of an API resource. 
Another issue is that eventually, you'll have to pollute your entity with web-related things such as `@JsonIgnore` and so on. 
Another problem is that if you do this in combination with the OSIV setting (see [tip 13](#tip-13-be-aware-of-the-open-session-in-view-osiv-setting)), you might be lazily fetching everything when Jackson starts serializing your entity to JSON.

### Tip 21: Use bean validations

When handling user input, you probably want to validate if everything is OK. 
You could do that by writing custom validation logic, but you can also use bean validations. 
For example:

```java
public class CreateEmployeeDTO {
    @NotBlank
    private String firstname;
    @NotBlank
    private String lastname;
    @NotBlank
    private String title;
    @NotNull
    @Past
    private LocalDate joinedDate;
}
```

Read more about this in [my blog post about validating the input of your REST API](https://dimitr.im/validating-the-input-of-your-rest-api-with-spring).

### Tip 22: Think about integration testing... again

As I mentioned within the data access tips ([tip 11](#tip-11-think-about-integration-testing)), integration testing is important. 
When dealing with endpoints, you may want to test the entire endpoint, and not just what happens within your controller.

To do that, you could spin up your application and use a framework like [REST Assured](https://rest-assured.io/) to test your API. 
Personally, I love using Spring's MockMvc to test my endpoints. 
You could debate whether or not it's an actual integration test (since we're running a mock MVC container), but using MockMvc works just fine.

You can read more about this type of testing in [my tutorial about testing your REST controllers](https://dimitr.im/testing-your-rest-controllers-and-clients-with-spring).

### Tip 23: Think security-first

Security is hard, but it's not something we should keep postphoning until the end of our project. 
When writing a REST API, start by properly securing your API. 
Personally, I find it a lot easier to include security at the start of the project, than later on. 
Spring also does a good job of making something difficult as security, as simple as possible.

### Tip 24: Make pagination easier with Spring data support

When working with pagination and Spring data, you probably encountered the `Pageable` parameter and its `PageRequest` implementation. 
If you haven't, this object allows you to define exactly which page you want to retrieve from your database:

```java
Sort sortByJoinedDate = Sort.by(Sort.Direction.ASC, "joinedDate");
Pageable firstPage = PageRequest.of(0, 10, sortByJoinedDate);
```

Now, if you're creating a REST API, you probably want to pass those parameters as well. 
Luckily, with Spring Data's web support, you can actually add a `Pageable` parameter to your controller, and that's it:

```java

@GetMapping("/api/employee")
public List<Employee> findAll(Pageable pageable) {
    // TODO: Implement
}
```

Now you can call your API like this: `/api/employee?page=0&size=10&sort=joinedDate,asc`.

### Tip 25: Use RestTemplateBuilder

If you're consuming REST API's, you probably used `RestTemplate` before. 
`RestTemplate` makes it easy to call a REST API and apply converters to the response (such as converting the JSON to objects with Jackson). 
Due to the possibility of you having to add additional message converters (eg. for applying security, ...), Spring does not provide a single `RestTemplate` bean. 
You have to declare that bean by yourself, for example by using:

```java
@Bean
public RestTemplate restTemplate() {
    return new RestTemplate();
}
```

However, as there are certain useful message converters that you need in most situations, Spring does define a `RestTemplateBuilder` bean. 
It's recommended to create your own `RestTemplate` instances by using that builder:

```java
@Bean
public RestTemplate restTemplate(RestTemplateBuilder builder) {
    return builder.build();
}
```

## Project structure tips

### Tip 26: Prefer structuring by domain

Often, people structure their code like this:

- `com.example.xyz.service`
- `com.example.xyz.controller`
- `com.example.xyz.entities`
- ...

The downside of this is that code that's related to each other is spread all around. 
Let's say I have a big application, and I have to make an addition to the "employee"-stuff within our application. 
In that case, I'll probably have to change classes across most of those packages.

What if, in stead of grouping your code by application layer, you group it by its domain, in this case employee? 
That means that all code related to employees can be found at one spot.

### Tip 27: Prefer domain classes over utilities

When implementing your logic, you probably will have to do certain stuff to your domain classes. 
For example, let's say we want to find out the age of a person. 
Sometimes, people implement such things by writing either a `PersonService` or a `PersonUtils` class, and add something like this:

```java
public int calculateAge(Person person) {
    LocalDate today = LocalDate.now();
    return Years.yearsBetween(person.getBirthDate(), today);
}
```

While this works, it would be a lot better if you moved that logic to the `Person` class itself, where it belongs:

```java
public class Person {
    // ...
  
    public int calculateAge() {
        LocalDate today = LocalDate.now();
        return Years.yearsBetween(person.getBirthDate(), today);
    }
}
```
